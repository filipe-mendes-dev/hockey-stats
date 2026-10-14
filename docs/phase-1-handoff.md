# Phase 1 infrastructure handoff

Date: 2026-10-14. The PostgreSQL infrastructure increment is complete. The account-scoped API phase remains in progress.

## Implemented

- `compose.yaml` runs official `postgres:18-trixie` with a health check, loopback-only host port and a named data volume mounted at `/var/lib/postgresql`.
- `.env.example` supplies local database settings and reserves `DATABASE_URL` for server integration. `.gitignore` excludes local environment files while retaining the example. A local `.env` was created from the example.
- `package.json` adds `db:up`, `db:down`, `db:logs` and `db:psql` without changing dependencies.
- `README.md` documents startup, connection settings, volume retention and image updates. Architecture, development-plan and backlog documents reflect this increment.

## Non-test verification

- `docker compose config --quiet` passed.
- PostgreSQL started through Compose and reached healthy status. The running image reports PostgreSQL 18.6 on ARM64, with host binding `127.0.0.1:5432`.
- A password-authenticated TCP connection inside the container returned the expected `benchline_stats` database and `benchline` user.
- A temporary table and marker survived `docker compose down` followed by `npm run db:up`. `npm run db:psql` read the retained marker. The table was then removed; the public schema contains no application tables.
- `npm run check` passed formatting, lint, typecheck and production build. Initial typecheck/build attempts failed on unused imports in a stale `.next/dev/types/validator.ts`. Removing that ignored generated file allowed the checks to pass; no application or TypeScript configuration changed.
- `git diff --check` passed. Git ignores `.env` and `.env.local` and retains `.env.example`.
- An optional formatting check that bypassed `.prettierignore` reported formatting differences in `architecture.md`, `backlog.md` and `development-plan.md`. Their unchanged HEAD versions also fail that check. These documents are excluded from the repository formatting command; their existing formatting was preserved. The README and this handoff passed the direct check.

No tests were read, added or run. Docker Desktop and the healthy PostgreSQL container were left running; `npm run db:down` stops the project's container while keeping its volume.

## Remaining Phase 1 work

Authentication, auth persistence/migrations and the protected shell are now implemented as recorded below. Account-scoped product routes/API, durable command receipts, account settings, admin navigation/UI and personal workspace provisioning remain deferred. The Phase 1 account-isolation and command-receipt acceptance criteria have not passed yet.

## Authentication increment

Implemented on 2026-10-14. Better Auth/adapter/CLI 1.7.8 manages username/password authentication, database sessions, credentials and plugin role fields. Drizzle ORM 0.45.4, Drizzle Kit 0.31.11 and `pg` 8.23.1 provide the database connection and migration workflow. Password prompts use `@clack/prompts` 1.6.0. No workspace table or email delivery infrastructure was added.

### Behavior and setup

- `/sign-in` is a public username/password form; an authenticated visit redirects to `/`.
- `/` checks the server session and redirects unauthenticated visitors to `/sign-in`. Its shared header contains language selection and sign-out; the main content greets the user.
- Better Auth uses its generated schema with username and admin plugins. Sessions stay in PostgreSQL with cookie caching disabled. HTTP signup, email login/verification/reset and unused profile mutation routes are disabled.
- `user` has no user-management permission. `admin` has only `user:create`; role assignment and other admin management are deferred. Normal user creation defaults to `user`.
- `auth:bootstrap-admin` creates the first admin through a trusted terminal invocation and refuses when an admin exists. `auth:create-user` signs in the administrator, creates a normal user through Better Auth's protected API and revokes the helper's session afterward.
- Creation validates username, display name and password before creating an identity. The username plugin checks normalization/uniqueness; Better Auth hashes credentials. A creation hook generates a hidden non-deliverable email value for core schema compatibility.
- `.env` now contains generated local auth settings. Its secret was not printed or committed. Configure `BETTER_AUTH_SECRET` and the matching `BETTER_AUTH_URL`, run `db:migrate`, then `auth:bootstrap-admin`. See [README setup](../README.md#authentication-and-migrations).

### Non-test checks

- Generated the auth schema from the configured Better Auth instance, reviewed the SQL and applied `0000_auth_foundation.sql` to PostgreSQL. One migration is recorded and all four auth tables exist.
- Formatting, lint, typecheck and production build passed. The earlier stale generated dev validator stopped reporting errors once the API route existed. Temporary CLI prompt typing errors were corrected before the successful checks.
- Ran the bootstrap and creation commands with temporary admin/user identities. Creation succeeded with masked prompts; a second bootstrap refused without modifying users.
- Against the production server on port 3001, browser verification confirmed unauthenticated redirect, invalid-credential feedback, successful login, authenticated reload and sign-out returning to login. Both locales were inspected. Portuguese mobile content fits a 360 CSS-pixel viewport without horizontal scrolling. Screenshots are under ignored `output/playwright/`.
- Manual HTTP checks returned 401 for anonymous creation, 403 for normal-user creation/role assignment and 404 for public registration. Short initial passwords and case-insensitive duplicate usernames returned 400. Admin attempts to assign an admin role returned 403 under the restricted permission set.
- Sign-out and helper cleanup left no active verification sessions. Temporary users were removed after verification, leaving the database ready for the user's real admin bootstrap.
- `npm audit` reports 9 dependency findings, with 5 high findings in the pre-existing Next.js lint chain and 4 moderate findings in Drizzle Kit's esbuild loader chain. Better Auth declares the migration toolkit as a peer, so `npm audit --omit=dev` still reports those 4 moderate findings. No forced downgrade or unrelated dependency rewrite was applied.

No test files were read, added or run. Phase 1 remains in progress because its workspace isolation and command-receipt acceptance work is outside this increment.

### File report

| File                                     | Change                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `.env.example`                           | Document database URL, auth secret and application origin.                               |
| `package.json`                           | Pin auth/SQL dependencies; add migration, schema and user-creation commands.             |
| `package-lock.json`                      | Lock installed dependencies.                                                             |
| `tsconfig.json`                          | Typecheck terminal helpers and permit explicit TypeScript import extensions for Node 24. |
| `drizzle.config.ts`                      | Configure PostgreSQL schema and migration directory.                                     |
| `drizzle/0000_auth_foundation.sql`       | Create Better Auth's core/plugin tables, indexes and foreign keys.                       |
| `drizzle/meta/0000_snapshot.json`        | Generated migration schema snapshot.                                                     |
| `drizzle/meta/_journal.json`             | Generated migration history.                                                             |
| `src/server/environment.ts`              | Validate server database/auth environment values.                                        |
| `src/server/db/client.ts`                | Reuse a server-only PostgreSQL pool and Drizzle instance.                                |
| `src/server/db/auth_schema.ts`           | Generated Better Auth username/admin schema and relations.                               |
| `src/server/db/schema.ts`                | Re-export modular schema definitions for Drizzle and existing consumers.                 |
| `src/server/auth/auth.ts`                | Configure Better Auth, validation hooks and disabled routes.                             |
| `src/server/auth/permissions.ts`         | Define normal/admin permission sets.                                                     |
| `src/server/auth/session.ts`             | Read and validate the current request's database session.                                |
| `scripts/prompts.ts`                     | Shared validated, masked terminal prompts and failure handling.                          |
| `scripts/bootstrap-admin.ts`             | Create the first admin without modifying existing users.                                 |
| `scripts/create-user.ts`                 | Authenticate an admin, create a normal user and revoke the helper session.               |
| `src/app/api/auth/[...all]/route.ts`     | Mount Better Auth's Next.js handler.                                                     |
| `src/app/page.tsx`                       | Protect the home route and render authenticated content.                                 |
| `src/app/sign-in/page.tsx`               | Render login or redirect an existing session home.                                       |
| `src/app/globals.css`                    | Inherit the app font for inputs and buttons.                                             |
| `src/client/auth/client.ts`              | Create the browser username auth client.                                                 |
| `src/client/auth/login-form.tsx`         | Add accessible login, pending state and translated errors.                               |
| `src/client/auth/styles.module.css`      | Style the responsive login form.                                                         |
| `src/client/shell/app-shell.tsx`         | Add shared header/main structure, locale control and sign-out.                           |
| `src/client/shell/home-content.tsx`      | Render the translated authenticated greeting.                                            |
| `src/client/shell/styles.module.css`     | Style the shared shell and flexible header controls.                                     |
| `src/client/shell/placeholder-shell.tsx` | Remove the Phase 0 shell replaced by the authenticated flow.                             |
| `src/messages/en.json`                   | Add English auth/home messages and remove obsolete setup-only text.                      |
| `src/messages/pt-PT.json`                | Add matching Portuguese auth/home messages.                                              |
| `README.md`                              | Document environment, migration, bootstrap and user-creation setup.                      |
| `docs/account-auth.md`                   | Record the implemented auth scope and pinned versions.                                   |
| `docs/architecture.md`                   | Update implemented status and structure.                                                 |
| `docs/backlog.md`                        | Retain deferred settings/admin/workspace work and record resolved versions.              |
| `docs/development-plan.md`               | Record authentication completion while keeping Phase 1 in progress.                      |
| `docs/phase-1-handoff.md`                | Record this verification and file report.                                                |
