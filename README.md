# Benchline Stats

Offline-first roller-hockey application. Local team/player management, new-match setup, recording and retained match history are planned. Accounts and a PostgreSQL-backed API provide optional synchronization.

## Current state

The application provides Better Auth username/password login, PostgreSQL-backed sessions, admin-created users, Drizzle migrations and a minimal authenticated shell. Phase 2 adds a public `/app` placeholder, installation metadata/icons and a Serwist worker that caches its application files. English and European Portuguese work offline. There is no public registration or email service. IndexedDB initialization, hockey features, synchronization, account settings and admin UI remain unimplemented.

## PWA increment

Build with `npm run build`, then run `npm run start -- --port 3001` and open [the local app](http://localhost:3001/app). `/` retains the authenticated Phase 1 shell. The worker registers only in production mode; `npm run dev` displays that offline installation is disabled. Use a separate production-check port so a previously installed worker does not interfere with your development origin.

Wait for the application-files status before disconnecting. This status verifies the worker's cached files; full application readiness also needs the upcoming local database increment. Installation itself does not create teams or games. Chromium installation and Safari's Add to Home Screen depend on the device/browser; native installation has not yet been verified on physical devices.

Serve deployed environments over HTTPS. Localhost/loopback works for local worker verification, but a plain HTTP LAN address is not an equivalent phone/tablet setup. An update stays waiting until all Benchline Stats tabs and app windows close. Reopening activates it without an unexpected reload during use. See [Phase 2 checks and limitations](docs/phase-2-handoff.md).

## Setup

Use Node.js 24 and npm 11. The `.nvmrc` selects the supported Node major.

```sh
npm ci
```

Configure the environment, start PostgreSQL and apply migrations as described below before running `npm run dev`.

Open [localhost:3000](http://localhost:3000). Language selection uses `localStorage` under `benchline.locale`; URLs stay unprefixed. Initial server rendering and hydration use English, then the browser restores the saved language and updates the document language. Both catalogs ship with the client. Storage restrictions allow switching for the mounted session but prevent saving across reloads.

```sh
npm run check
npm run start
```

`check` runs formatting verification, lint, typecheck and a production build. It does not run tests. `start` serves that build. Individual commands are `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck` and `npm run build`. CLI arguments pass through, for example `npm run dev -- --port 3001`.

## Local PostgreSQL

Install and start Docker with the Compose plugin, then run from the repository root:

```sh
cp .env.example .env
npm run db:up
```

Copy the example only when `.env` does not already exist. Compose and Next.js read the root `.env`; Git ignores it. The example credentials are for local development. Keep `DATABASE_URL` aligned with `POSTGRES_*`. URL-encode special characters in the connection URL. If port 5432 is occupied, change `POSTGRES_PORT` and the URL's port together. A Next.js `.env.local` value overrides `.env`; the auth/migration commands load both files with the same precedence. Shell environment variables take priority.

Replace the example `BETTER_AUTH_SECRET` with a random secret of at least 32 characters. To generate one:

```sh
node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(48).toString('hex'))"
```

Set `BETTER_AUTH_URL` to the application's origin, initially `http://localhost:3000`. It must match the hostname and port used in the browser. Use HTTPS for a deployed application. Environment validation rejects missing values and the example secret.

`compose.yaml` uses the official `postgres:18-trixie` image. PostgreSQL has no separate LTS edition; each major receives five years of support, and version 18 is supported through November 14, 2030. The tag stays on major 18 and Debian Trixie while allowing minor fixes. See the [PostgreSQL versioning policy](https://www.postgresql.org/support/versioning/) and [official image documentation](https://hub.docker.com/_/postgres).

The database listens on `127.0.0.1:5432` by default. `db:up` waits for the health check. Compose stores data in the `postgres_data` named volume mounted at `/var/lib/postgresql`, as required by the version 18 image. The app continues to run on the host with `npm run dev`.

```sh
npm run db:psql
npm run db:logs
npm run db:down
```

In `psql`, `SELECT current_database(), current_user, version();` checks the connection; `\q` exits. `db:down` stops and removes the containers but retains the data volume. Starting again reuses that database. Changing `POSTGRES_DB`, `POSTGRES_USER` or `POSTGRES_PASSWORD` after initialization does not change the existing database or role; apply those changes through SQL and update the connection URL. Removing the volume deletes local data. Do not use `docker compose down --volumes` unless that deletion is intended.

To fetch minor image updates, run `docker compose pull postgres`, then `npm run db:up`. Major upgrades require a separate database migration; changing the image major alone does not upgrade stored data. This Compose file is a local development setup. Production hosting and credentials remain a separate decision.

## Authentication and migrations

```sh
npm run db:migrate
npm run auth:bootstrap-admin
npm run dev
```

Bootstrap prompts for your admin username, display name and initial password. Password input is masked. It refuses to create another admin when one exists and never modifies or promotes an existing user. Open `/sign-in` to log in. `/` requires a valid session and contains the sign-out button.

To create a normal user before the admin screen exists:

```sh
npm run auth:create-user
```

The command prompts for your admin credentials, then the new user's username, display name and initial password. It authenticates the administrator, delegates creation to Better Auth and revokes its temporary admin session afterward. A normal user cannot create users or assign roles. The admin currently has only the user-creation permission. Share the initial password outside the application; password-change UI and recovery remain backlog items.

Usernames contain 3 to 30 letters, numbers, underscores or dots and are normalized to lowercase. Passwords contain 8 to 128 characters. Better Auth generates a hidden internal email value for compatibility; users never provide an email and no messages are sent. Authentication tables and password hashes remain server-only. Workspace ownership is not implemented yet.

For schema changes:

```sh
npm run auth:schema
npm run db:generate -- --name describe_change
npm run db:migrate
```

Regenerate the auth schema only when its configuration/plugins change. The generator writes to `src/server/db/auth_schema.ts`; `src/server/db/schema.ts` re-exports schema modules for Drizzle and existing consumers. Add future schema modules to that central file. Review the generated schema, SQL and metadata and commit them together. Keep applied migrations intact. Run migrations explicitly before serving dependent code. The current migration is `drizzle/0000_auth_foundation.sql`.

## Project structure

The repository root is the application root. Run npm commands here. One `package.json`, lockfile and TypeScript configuration cover the application and terminal helpers.

```text
src/
  app/                # Route pages and layouts
  client/
    auth/             # Login form and browser auth client
    shell/            # Shared header, home content and adjacent CSS
    i18n/             # Client language provider
  i18n/               # Locale configuration and preference logic
  messages/           # English and pt-PT catalogs
  server/             # Environment, Better Auth and PostgreSQL code
scripts/              # Interactive admin bootstrap and user creation
drizzle/              # Versioned SQL migrations and metadata
```

Add domain and transport code only when an authorized feature needs it. Tests require explicit user instruction after a functioning version exists and should target specific important behavior. Separate packages and workspace scripts are unnecessary for the current prototype; discuss additional structure only when a concrete requirement needs it.

`next typegen` runs before typecheck and generates route and exact translation declarations. These generated files do not need to be committed. Typed translation keys and arguments remain available without a test suite.

See the [Phase 1 handoff](docs/phase-1-handoff.md) for authentication verification and the file report. The [Phase 0 handoff](docs/phase-0-handoff.md#setup-only-cleanup) retains earlier setup evidence.

## Development context

Read [AGENTS.md](AGENTS.md) before changing the repository.

| Document                                             | Purpose                                                                             |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [Product requirements](docs/product-requirements.md) | Product scope and acceptance scenarios.                                             |
| [Architecture](docs/architecture.md)                 | Stack, account routing, ownership boundaries and repository structure.              |
| [Domain model](docs/domain-model.md)                 | Entity contracts, event variants, ordering and lineup corrections.                  |
| [Recorder UX](docs/recorder-ux.md)                   | Draft lifetime, interaction paths, required details and clock behavior.             |
| [Offline and sync](docs/offline-sync.md)             | Local persistence, API protocol, account isolation and failures.                    |
| [Localization](docs/localization.md)                 | English/Portuguese catalogs, locale preference, formatting and offline translation. |
| [Development plan](docs/development-plan.md)         | Incremental phases, tests, acceptance criteria and first implementation prompt.     |
| [Backlog](docs/backlog.md)                           | Deferred work and decisions required before dependent phases.                       |

Phase 1 is complete for the agreed authentication/database foundation. Workspace-scoped product persistence and command receipts belong to Phase 3's synchronized recording slice. Account settings and admin UI remain in the backlog.
