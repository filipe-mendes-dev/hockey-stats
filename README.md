# Benchline Stats

An offline-capable rink-hockey prototype for Players, Teams and live Matches. Require one successful online sign-in, then use the same IndexedDB write path online and offline. One durable outbox synchronizes accepted data with user-scoped PostgreSQL records.

## Current state

Players support create/search/list/details. Teams add editing and multi-select Player assignments with optional jersey numbers and roles. Matches support incomplete setup, pre-start editing, starter/period configuration, clock controls, recovery/loss/shot/foul/cards, paired substitutions, manual powerplay completion and fifth-player entry, score, timeline, latest-event Undo and completed read-only summaries.

English and European Portuguese are bundled. Fixed query-based detail/Start/live routes work offline for locally available data. The dark layout is a prototype. Rink interaction, historical edits/deletes, automatic penalty timing, conflict-resolution UI, analytics and account-management UI are deferred. See [Product requirements](docs/product-requirements.md) and [Backlog](docs/backlog.md).

## Production offline preview

```sh
npm run build
BETTER_AUTH_URL=http://127.0.0.1:3001 npm run start -- --hostname 127.0.0.1 --port 3001
```

Open `http://127.0.0.1:3001/app`. The browser URL and BETTER_AUTH_URL must match hostname and port. Use HTTPS outside loopback. Use a separate origin from development so an installed worker does not serve an older production document during `npm run dev`.

Wait for offline readiness before disconnecting. It requires verified generic app files and successful IndexedDB initialization. First-time ownership setup still requires online sign-in. Installation alone does not download Team/Player data or guarantee permanent storage.

Updates wait until all tabs/app windows for that origin close. Reopen to activate the new build; do not force reload during tracking. Worker registration is disabled in development. See [Offline and sync](docs/offline-sync.md).

Explicit sign-out removes the complete application IndexedDB, including unsynced records, after server sign-out succeeds. Generic cached files remain. Browser storage loss/device failure can also lose local work; export/backup is not implemented.

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

Usernames contain 3 to 30 letters, numbers, underscores or dots and are normalized to lowercase. Passwords contain 8 to 128 characters. Better Auth generates a hidden internal email value for compatibility; users never provide an email and no messages are sent. Authentication tables and password hashes remain server-only. All sync endpoints authorize every request against the session and expected local owner.

For schema changes:

```sh
npm run auth:schema
npm run db:generate -- --name describe_change
npm run db:migrate
```

Regenerate the auth schema only when its configuration/plugins change. The generator writes to `src/server/db/auth_schema.ts`; `src/server/db/schema.ts` re-exports schema modules for Drizzle and existing consumers. Add future schema modules to that central file. Review the generated schema, SQL and metadata and commit them together. Keep applied migrations intact. Run migrations explicitly before serving dependent code. The migration journal currently runs through `0011_powerplay_events.sql`. Apply the complete checked-in history.

## Project structure

One package at the repository root contains the app and terminal helpers. Named client pages/components, feature-owned queries/mutations/services, shared domain/contracts and server repositories/services are described in [Architecture](docs/architecture.md).

Client components use PascalCase files with adjacent ComponentName.module.css imported as st and interfaces where needed. Current local storage is Dexie schema version 9. SQL migrations, wire versions and worker caches are versioned separately.

## Documentation

Read [AGENTS.md](AGENTS.md) before changing the repository. The docs folder contains current reference material; superseded proposals, file inventories and historical handoffs have been consolidated here.

| Document                                             | Purpose                                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| [Product requirements](docs/product-requirements.md) | Current prototype scope and acceptance scenarios.                      |
| [Architecture](docs/architecture.md)                 | Source organization, shared state and transaction boundaries.          |
| [Domain model](docs/domain-model.md)                 | Entities, events, eligibility, powerplay, clock and Undo.              |
| [Recorder UX](docs/recorder-ux.md)                   | Entry flow, draft lifetime, feedback and completed summaries.          |
| [Offline and sync](docs/offline-sync.md)             | Ownership, storage, command delivery, routing and failure policy.      |
| [Account authentication](docs/account-auth.md)       | Sessions, permissions, account setup and sign-out.                     |
| [Localization](docs/localization.md)                 | Catalogs, language preference, formatting and offline behavior.        |
| [Development plan](docs/development-plan.md)         | Implemented scope, verification evidence and remaining release checks. |
| [Backlog](docs/backlog.md)                           | Deferred work and decisions for later increments.                      |

Automated tests require explicit authorization under AGENTS.md. Current non-test checks do not establish physical-device or full browser-family readiness.
