# CI and container publishing

Increment 3A adds PR validation and GHCR publishing before the first VPS deployment. Production deployment remains a separate, manually triggered workflow to implement later. These workflows do not access the VPS, run migrations or create a staging environment.

## Branch and release flow

1. Open `feature/*` or `fix/*` PRs into `staging` and squash them after CI passes.
2. Accumulate reviewed changes on `staging`.
3. Open a release PR from `staging` into `master` and wait for CI again.
4. Use **Create a merge commit** for the release PR. Keep `staging` for subsequent work.
5. The push to `master` publishes its commit-specific image. Publishing does not deploy it.

CI filters on the PR's target branch. Source branch names and merge-method selection are repository policy; the workflow does not enforce them. After a release, incorporate the new `master` merge commit into `staging` through the normal review process when needed to keep the next promotion current. Do not squash or rebase the long-lived staging-to-master promotion.

## Workflows

| Workflow                              | Trigger                                                      | Work                                                                 |
| ------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------- |
| `.github/workflows/ci.yml`            | PR opened, reopened or updated against `staging` or `master` | Validate GitHub's PR merge result on a GitHub-hosted Ubuntu runner.  |
| `.github/workflows/publish-image.yml` | Push to `master`, including a merged release PR              | Build the existing Dockerfile for `linux/amd64` and publish to GHCR. |

CI uses Node.js 24, npm download caching and the existing scripts:

```sh
npm ci --include=dev
npm run format:check
npm run lint
npm run build
```

`next build` checks TypeScript and generates the production service worker. A separate `npm run typecheck` would repeat type checking; the aggregate `npm run check` includes that extra pass and is therefore not used. CI builds once and does not also build a Docker image. Formatting follows the existing `.prettierignore`, which excludes docs. CI uses disposable build-time configuration, requires no production secrets or database and runs no tests.

The publishing workflow builds once inside Docker. It does not repeat npm installation/build on the runner. Buildx caches intermediate layers with `type=gha`, scope `benchline-amd64` and `mode=max`. The same Dockerfile, Compose services, database volume and external runtime configuration remain in use. Only official GitHub and Docker actions are used, pinned to verified commit SHAs with version comments.

## Authentication and image identity

CI grants only `contents: read`. The publishing job grants `contents: read` and `packages: write`; all other token permissions are unset. Checkout does not persist credentials. GHCR login uses `${{ github.actor }}` and the automatically supplied `${{ secrets.GITHUB_TOKEN }}`. No publishing PAT, repository secret or VPS credential is needed. See [GitHub's container registry authentication](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).

For this repository, the image is:

```text
ghcr.io/filipe-mendes-dev/benchline-stats:sha-<full-master-commit-sha>-run-<run-id>-attempt-<attempt>
```

The owner is lowercased from `GITHUB_REPOSITORY_OWNER`. The tag includes the full `GITHUB_SHA`, `GITHUB_RUN_ID` and `GITHUB_RUN_ATTEMPT`. Every execution, including a rerun, gets its own tag so it cannot overwrite an earlier publication. The SHA identifies the pushed `master` commit. With the agreed merge strategy, this is the release merge commit, not the staging tip or the temporary PR merge SHA. No `latest`, Git tag or GitHub Release is created. OCI labels record the source repository and commit.

A successful run records the versioned tag and `image@sha256:...` reference in its summary. GHCR tags can still be changed by other writers or administrators; the digest is the immutable deployment identity. Keep published versions and use the digest in the later deployment workflow. Copy the selected reference from the summary rather than constructing it from the commit alone.

## Manual GitHub configuration

1. Create `staging` from the intended integration baseline. Ensure both workflows reach `staging` and `master` through reviewed PRs. Use the existing development branch for the bootstrap PR; use `feature/*` or `fix/*` for new work. Setting `staging` as the default branch makes it the default PR target, if desired.
2. In **Settings → Actions → General**, enable Actions and allow the pinned `actions/*` and `docker/*` actions. Keep the default token permissions read-only. The publishing job requests package write access explicitly; any organization policy must permit it. Approve first-time fork workflows when required.
3. Protect both `staging` and `master` with PR requirements and the **Validate** status check from the CI workflow. Run CI once so the check is selectable. Require the branch to be up to date, block force pushes/deletion and apply the rules to maintainers who could otherwise bypass them. If the repository is private, check that the account plan supports the chosen protection/ruleset features.
4. In **Settings → General → Pull Requests**, allow squash merging and merge commits. Rebase merging can be disabled. Do not require linear history on `master`, because promotions need merge commits. Choose squash for development PRs and a merge commit for promotions; rulesets can enforce branch-specific merge methods where available. Keep the protected `staging` branch after promotion. See [GitHub's merge methods](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github).
5. After the first publish, open **profile → Packages → benchline-stats → Package settings**. New packages default to private. Confirm the package is linked to `filipe-mendes-dev/hockey-stats` and that the repository has write access under **Manage Actions access** or inherited repository permissions. If the package already exists, grant this access before publishing.
6. Choose package visibility explicitly. Public GHCR packages allow anonymous pulls and expose the packaged source. Keeping it private requires registry authentication for local/VPS pulls. For those pulls, use a PAT classic limited to `read:packages` and an account with package access; do not store it in the app environment file. The workflow continues using `GITHUB_TOKEN`. See [package access and visibility](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility).

Branch protection is what prevents a direct push from bypassing PR validation. The publishing trigger intentionally covers every push to `master`; it does not implement a second PR approval system.

## Verify the first published image

First validate a feature PR into `staging`, then the `staging` release PR into `master`. Confirm **Validate** passes on each. Merge the release with a merge commit and wait for **Publish image** to succeed. Check that its SHA matches the resulting `master` commit and that the package has that exact tag.

Run on the Mac without sudo. Copy the published tag from the workflow summary:

```sh
BENCHLINE_IMAGE=PASTE_TAGGED_IMAGE_FROM_WORKFLOW_SUMMARY

# Required only for a private package; enter the read-only PAT at the prompt.
docker login ghcr.io --username filipe-mendes-dev

docker buildx imagetools inspect "$BENCHLINE_IMAGE"
docker pull --platform linux/amd64 "$BENCHLINE_IMAGE"
docker image inspect "$BENCHLINE_IMAGE" --format '{{.Architecture}} {{.Config.User}} {{index .Config.Labels "org.opencontainers.image.revision"}}'
docker run --rm --platform linux/amd64 --entrypoint node "$BENCHLINE_IMAGE" -p 'require("next/package.json").version'
```

Expect an AMD64 manifest, user `node`, the exact release SHA and the locked Next.js version. The inspection can also list an attestation manifest with platform `unknown`; this is not another runnable architecture. Compare the registry digest to the summary, then verify that exact reference:

```sh
BENCHLINE_DIGEST=sha256:PASTE_DIGEST_FROM_WORKFLOW_SUMMARY
docker pull --platform linux/amd64 "ghcr.io/filipe-mendes-dev/benchline-stats@${BENCHLINE_DIGEST}"
```

The package inspector does not start the web server or need production credentials. A repeat of the disposable production-Compose acceptance checks can verify runtime behavior against the pulled image before deployment. Never use production credentials for that exercise. Live Actions execution, GHCR write access and the first remote image remain unverified until the workflows are merged and run on GitHub.

## Increment 3A verification

Local verification on 2026-10-23 passed `actionlint` 1.7.12, workflow formatting, documentation links/anchors, shell-block syntax and diff whitespace checks. A clean disposable AMD64 Linux container ran the exact CI sequence with Node.js 24: locked installation, existing formatting/lint scripts and the production build. TypeScript passed and the worker generated 98 precache entries. Installation retained the nine previously documented tooling advisory entries; no dependencies changed.

The digest inspection command was verified against an existing official public GHCR image. The Dockerfile, production/development Compose files and PostgreSQL initialization script are unchanged. No automated tests, VPS commands, migrations, publishing or repository-setting changes were run. The disposable container and source snapshot were removed. Actual GitHub-hosted execution, Buildx cache storage and authenticated publication remain pending the first release run.
