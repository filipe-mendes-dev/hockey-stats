# VPS deployment reference

## Scope and current status

Deploy Benchline Stats to `https://benchline.filipemendes.dev` on the existing Netcup VPS: Debian 13, AMD64, four CPUs, 8 GB RAM and 160 GB disk. SSH key access, a non-root sudo user, the Netcup firewall, Docker Engine, Docker Compose, host Nginx and DNS are already configured. The portfolio remains on Vercel.

Increments 1 and 2 are accepted, including the Next.js 16.4.2 patch and final local checks. VPS deployment, Nginx/HTTPS and backups are pending. Increment 3A adds [CI and GHCR publishing](ci-cd.md) before deployment. Use the [first VPS deployment guide](vps-first-deployment.md) for commands and checkpoints, and [Dependency advisories](security-advisories.md) for the remaining development-tool findings. No VPS commands have been executed.

## One image for CI and manual builds

The root Dockerfile is the production Dockerfile for GitHub Actions and manual builds. It uses Node.js 24 on Debian Bookworm and starts the existing production Next.js server on container port 3000.

Use an explicit release tag such as `benchline-stats:sha-<full-commit-id>`. Build only the source corresponding to that commit and do not reuse its tag for different contents. The publishing workflow builds on Ubuntu for AMD64. Its GHCR tag includes the full `master` commit SHA and unique workflow run/attempt IDs; use the published tag or digest from the run summary. The [deployment guide](vps-first-deployment.md) transfers matching Compose/init files and pulls the published image instead of building on the VPS. An ARM Mac build intended for the VPS requires `--platform linux/amd64`.

The build stage installs locked dependencies with `npm ci --include=dev` and runs `npm run build`. Development dependencies remain in the final image because the existing migration command needs `drizzle-kit`, account prompts need `@clack/prompts`, and the Next.js configuration imports build tooling. Source, SQL migrations and scripts remain available. There is no separate operations image.

The runtime uses the non-root `node` user and starts Node directly so it receives container shutdown signals. Publishing port 3000 is the responsibility of Docker or Compose; `EXPOSE` does not publish it. Production Compose binds it only to `127.0.0.1:3000`.

The build uses disposable database/authentication values to satisfy server-module validation. It does not connect to a production database. These values are scoped to the build command and are not runtime environment defaults. Runtime commands require their own configuration.

The `.dockerignore` allowlist excludes environment files, local dependencies, Git metadata, docs and generated host output. Do not pass production secrets through build arguments or copy them into source files. Keep production credentials outside the checkout, with restricted permissions and a separate recovery copy.

## Production Compose and credentials

Use `compose.production.yaml` explicitly. It does not extend or modify the development `compose.yaml`. Its default project is `benchline-production`, with a stable `benchline-production_postgres_data` volume mounted at `/var/lib/postgresql`, the PostgreSQL 18 volume location.

The two services share a dedicated bridge network. PostgreSQL has no published host ports. The app is published only on `127.0.0.1:3000`, so host Nginx can reach it. The bridge isolates unrelated Docker networks but permits outbound connections; it is not an egress firewall. Docker's `internal: true` prevented the host port from being published during verification and is deliberately not used.

Both services use `restart: unless-stopped` and JSON logs bounded to three 10 MB files each. PostgreSQL has a TCP readiness check; the app waits for it on startup. `up --wait app` confirms container startup, not application-level readiness; also check an HTTP response and authenticated database access. Application shutdown allows a 30-second grace period.

Copy `.env.production.example` outside the checkout to `/etc/benchline/production.env`. This is Compose interpolation input, not a file mounted into either container. The app receives only `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`. The database receives its maintenance password and the values needed to create the application role. Do not print resolved Compose configuration or container environments into shared logs; use `config --quiet` for validation.

| Variable                                      | Purpose                                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `BENCHLINE_IMAGE`                             | Required release-tagged application image or immutable digest.                                  |
| `POSTGRES_DB`                                 | Benchline database name. Keep it stable after initialization.                                   |
| `POSTGRES_ADMIN_PASSWORD`                     | Password for the PostgreSQL `postgres` maintenance administrator. Never passed to the app.      |
| `BENCHLINE_DB_USER` / `BENCHLINE_DB_PASSWORD` | Separate non-superuser role used by the app and migrations.                                     |
| `DATABASE_URL`                                | Uses `postgres:5432` inside Docker. The example expands the database variables through Compose. |
| `BETTER_AUTH_SECRET`                          | Independent random authentication secret, stable across releases.                               |
| `BETTER_AUTH_URL`                             | Exact public HTTPS origin, `https://benchline.filipemendes.dev`.                                |

Generate independent random hexadecimal secrets for the maintenance password, application password and authentication secret. For example, run `openssl rand -hex 32` separately for each password and `openssl rand -hex 48` for the authentication secret. Hex passwords work directly in the connection URL. If using another format, URL-encode its connection-string representation and quote dotenv values correctly. Keep a separate recovery copy of the completed file.

On the first empty-volume startup, `deploy/postgres/init-benchline.sh` creates the application role, makes it the Benchline database owner and removes public schema-creation permission. The role has no superuser, database-creation, role-creation, replication or RLS-bypass privileges. The application and migrations share this role. It owns the migration schema and application objects. The `public` schema retains PostgreSQL's `pg_database_owner` owner, which gives Benchline control through database ownership. Separate migration credentials remain deferred. PostgreSQL's maintenance administrator remains separate.

Initialization uses psql's identifier/literal quoting and reads passwords from the container environment rather than process arguments. It runs only for an empty PostgreSQL data directory. Changing passwords, names or the initialization script later does not modify an existing database. Rotate credentials through PostgreSQL and update configuration together. If first initialization fails, inspect logs and repair the partial initialization explicitly; do not delete a populated volume to retry it.

## First deployment

Use the [first VPS deployment guide](vps-first-deployment.md) for the matching release files, GHCR pull, external configuration, explicit migration/bootstrap, loopback verification and Nginx/HTTPS steps. It labels execution locations, sudo requirements and checkpoints. The release archive contains committed source only; production credentials are created separately on the VPS.

Do not use `down --volumes` for routine stops, upgrades or recovery. The named volume is persistence, not a backup; use disposable data until the backup/restore increment is complete.

## Explicit maintenance commands

The image's default command starts only the web server. It never applies migrations or creates accounts automatically. Run only the command needed from `/opt/benchline` on the VPS:

```sh
sudo docker compose --env-file /etc/benchline/production.env -f compose.production.yaml run --rm --no-deps app npm run db:migrate
sudo docker compose --env-file /etc/benchline/production.env -f compose.production.yaml run --rm --no-deps app npm run auth:bootstrap-admin
sudo docker compose --env-file /etc/benchline/production.env -f compose.production.yaml run --rm --no-deps app npm run auth:create-user
```

Start and wait for PostgreSQL before running these commands. `run` uses the selected application image and its existing network/environment mapping without publishing another app port. The application image contains no PostgreSQL server or database volume. There is no separate operations image or service.

Bootstrap prompts for credentials and refuses to create another administrator when one exists. Keep administrator passwords out of environment files and command arguments. The same image also supports `npm run auth:create-user`; the existing online Users page is available after bootstrap.

Apply only checked-in migrations. Generate and review new migrations during development rather than on the production server.

## GHCR delivery

GitHub Actions publishes to GitHub Container Registry, GHCR, after a push to `master`. See [CI and container publishing](ci-cd.md) for triggers, permissions, cache behavior and first-image verification. Deployment selects the published version or digest through `BENCHLINE_IMAGE`. Private package pulls on the VPS require `sudo docker login ghcr.io`. The Compose services, external credentials and named database volume stay in place. There is no `latest` default.

Keep the Compose project and volume names stable across releases. Do not derive them from commit IDs. Switching from manual builds to registry images changes image delivery without recreating the database.

## Delivery sequence

1. Package and verify one image locally. Complete.
2. Add production Compose, external configuration and database-role initialization. Complete, including the Next.js patch and final local checks.
3. Add PR CI and GHCR publishing before first deployment. Implemented for local review; GitHub execution and the first publish remain pending.
4. Implement the separate manually triggered production deployment, then configure Nginx/HTTPS and verify public PWA behavior.
5. Before important data or invited users, verify dump/restore and establish daily off-server backups with basic failure diagnostics.
6. Rehearse an update with queued offline work, document recovery and verify older-client compatibility. Preserve the existing safe worker activation policy, local records, receipts and deletion markers.

Keep existing images until recovery compatibility is understood. Starting an older image does not undo SQL migrations and may not understand newer sync data. Backups cannot recover browser work that has never synchronized. Never clear IndexedDB or force sign-out as a deployment step.

## Local verification

Increments 1 and 2 passed on 2026-10-22. Final checks passed on 2026-10-23 with Next.js 16.4.2 and an AMD64 production image under emulation on an ARM Mac. Verification used disposable PostgreSQL 18 data and external credentials. Existing development services were preserved.

| Check                        | Result                                                                                                                                                                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Locked build                 | Clean `npm ci`, production compilation, TypeScript, 29 routes and 98 service-worker precache entries passed.                                                                                                                                  |
| Image contents               | Runs as UID 1000; no `.env` files, Git metadata or database/authentication runtime defaults.                                                                                                                                                  |
| Database initialization      | PostgreSQL initialized successfully and its health check passed.                                                                                                                                                                              |
| Migrations                   | All 15 migrations applied using `benchline`; the earlier packaging check also verified a repeat run.                                                                                                                                          |
| Ownership                    | Benchline owns the database, migration schema, 13 tables, 29 indexes and one sequence. No mismatched relation, type or routine owners were found. It controls `public` through `pg_database_owner`; all five privileged role flags are false. |
| Runtime configuration        | Each required variable rejects missing input. Independent runtime credentials/origin supported bootstrap, admin sign-in/session and the authenticated Players API. No maintenance password was passed to the app.                             |
| Non-root cache writes        | An image-optimization request returned WebP and created `.next/cache/images` files owned by UID 1000.                                                                                                                                         |
| Network and service settings | Loopback HTTP passed, PostgreSQL had no host bindings, and restart/log limits matched Compose.                                                                                                                                                |
| Database persistence         | Increment 2 verified migration records and administrator authentication after full container recreation without volume removal.                                                                                                               |
| Image selection              | Increment 2 selected another versioned tag without changing services, credentials, ports, network or volume. This did not test registry downloads or changed-code compatibility.                                                              |
| PWA                          | Patched-build browser sign-in, worker delivery and a controlled offline reload passed. Worker headers retained root scope and no-store caching.                                                                                               |
| Source and docs              | Scoped lint, formatting, local documentation links and diff whitespace checks passed. Automated tests were not read, changed or run.                                                                                                          |

QA used temporary ports 3317, 3318 and 3319 because host port 3000 was occupied. Production Compose was separately validated as `127.0.0.1:3000:3000`. Unchanged Compose/init files were staged in a private temporary directory for Docker Desktop bind access. Lint configuration was supplied only to the disposable container because the image excludes it.

The disposable containers, volume, credentials and browser-local data were removed. The patched image remains locally as `benchline-stats:preflight-next-16.4.2-20261023`. See [Dependency advisories](security-advisories.md) for the audit assessment. Public DNS, Nginx/HTTPS, renewal and cross-release offline-client compatibility still require verification. No VPS commands were executed.
