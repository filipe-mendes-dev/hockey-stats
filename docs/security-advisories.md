# Dependency advisories

Reviewed on 2026-11-01 using the npm lockfile audit, installed package metadata, upstream advisories and local non-test acceptance. This is not a full application, container or host security assessment.

## Current result

Before remediation, the lockfile audit reported 24 affected package entries: 3 high, 21 moderate and no critical findings. After remediation it reports 23 entries, all moderate, with no high or critical findings. Parent packages inherit findings from shared dependencies, so these are not 23 independent vulnerabilities.

The remaining entries originate in minimatch, glob and Drizzle Kit's old esbuild loader. The production image includes development tools for maintenance commands. Omitting them from the audit would hide installed packages.

The separate `--omit=dev` audit still reports four moderate entries in the Drizzle Kit/esbuild chain. Those packages are also marked as optional peers in the lockfile. That narrower audit is not evidence of an advisory-free runtime image.

On 2026-11-02 the user chose to defer the remaining dependency/toolchain and broader reliability work while finalizing the beta launch. Residual exposure and unsupported ESLint are retained in the [Backlog](backlog.md). This scope decision does not make the dependency graph advisory-free. The counts above remain the 2026-11-01 assessment, not a fresh audit.

## Changes applied

| Package or path             | Before                                     | Current                                       |
| --------------------------- | ------------------------------------------ | --------------------------------------------- |
| Next.js                     | Manifest/lock 16.4.2; local install 16.4.0 | Manifest, lock and clean installation 16.4.3. |
| eslint-config-next          | 16.4.0                                     | 16.4.3, matching Next.js.                     |
| Serwist build packages' Zod | Nested 4.6.5                               | Root 4.6.7 through version-scoped overrides.  |

Latest stable @serwist/turbopack remains 9.5.13 and pins Zod 4.6.5. Overrides apply only beneath @serwist/build@9.5.13 and @serwist/turbopack@9.5.13, using the direct Zod version through npm's `$zod` reference. They replace a patch version without changing the worker architecture. Reassess them when upgrading Serwist.

[Zod's advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) affects versions below 4.6.6. Both nested vulnerable copies were removed.

Next.js 16.4.3 replaces the vulnerable local 16.4.0 installation. Earlier findings and patched ranges are documented in the [image optimization](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw), [Server Action](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r) and [cache typed-array](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr) advisories.

## Remaining moderate findings

| Dependency | Locked versions and exposure                                                                                                                                                                                    | Remediation limit                                                                                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| minimatch  | 3.1.5 and 10.2.6 in lint/build tools. The [advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249) identifies 11.0.1 as patched.                                                                           | Consumers span older major versions. A global override would change their supported API contract. Prefer compatible upstream releases.                                        |
| glob       | 13.0.6 through Serwist build. The [cancellation advisory](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) identifies 14.0.2 as patched.                                                                      | Serwist pins the old version. Replacing it crosses a major version and does not remove other minimatch consumers.                                                             |
| esbuild    | 0.18.20 through Drizzle Kit's deprecated @esbuild-kit loader. The [development-server advisory](https://github.com/advisories/GHSA-67mh-4wv8-2f99) identifies 0.25.0 as patched. Direct esbuild remains 0.28.2. | Latest stable Drizzle Kit 0.31.11 still uses this loader. Do not downgrade migration tooling or force its loader across compatibility boundaries without separate validation. |

Observed application commands do not expose glob patterns or start an esbuild development server. Serwist scans repository-controlled build paths; migration commands transform trusted configuration. This limits the identified exposure but does not establish that every tool path is safe.

Keep source/configuration trusted and do not publish development or Studio servers. No deployed proxy controls or production image were reverified in this increment.

The prior [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) was withdrawn on 2026-10-23. Its earlier high-severity counts no longer describe the current audit.

## ESLint support and installation warnings

The 2026-11-01 clean installation reported ESLint 9.39.5 as unsupported. Stable ESLint was 10.14.0 at that assessment, but installed eslint-plugin-react 7.37.5, eslint-plugin-import 2.32.0 and eslint-plugin-jsx-a11y 6.10.2 declared compatibility only through ESLint 9. A forced upgrade would bypass those peer contracts. Reassess supported upstream versions in the deferred toolchain increment.

npm also reports an optional browserslist peer-resolution warning under @serwist/utils. Clean installation, source lint, TypeScript and worker generation succeed. The warning was not suppressed with legacy peer resolution.

## Local verification

- Clean `npm ci --include=dev --no-audit` succeeded from the updated lockfile.
- Source/configuration ESLint, TypeScript and changed-file formatting passed.
- The production build exited successfully on Next.js 16.4.3 and generated 99 worker precache entries.
- An isolated Chromium session loaded the app entry offline using disposable ownership metadata. The horizontal logo returned 200 through the worker; an uncached request failed. Expected offline session/request errors were distinguished from application runtime errors.
- The disposable browser session, worker and caches were closed/removed. No real account or recording was used.
- No automated tests were read, added, changed or run. No migrations, deployment, container rebuild, authenticated synchronization or older-client upgrade rehearsal was performed.

Repeat the assessment with:

```sh
npm audit --package-lock-only --json
npm ls --depth=0
npm run check
```

The audit returns nonzero while findings remain. Do not use `npm audit fix --force` to satisfy a numeric target; proposed remediations include incompatible downgrades. See [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/) and [npm overrides](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#overrides).
