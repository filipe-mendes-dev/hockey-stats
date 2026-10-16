# Architecture

Status: PostgreSQL, Better Auth username/password authentication, Drizzle migrations and the minimal protected shell are implemented. Phase 2 now adds the manifest/icons, public `/app` shell and Serwist asset caching. Local database initialization, product workflows and synchronization remain unimplemented.

## Stack

| Area | Decision | Reason |
| --- | --- | --- |
| Web framework | Next.js App Router with TypeScript and React. | Serve a generic client application for local workflows and retain Route Handlers for authenticated account/sync operations. |
| API | Next.js Route Handlers with separate server services and repositories. | One application deployment with explicit HTTP, workflow and storage boundaries. |
| Authentication | Better Auth with username/password, `username`/`admin` plugins and database-backed sessions. | Admin-created users, normal/admin permissions and cookie-based browser login without email infrastructure. |
| SQL access and migrations | Drizzle ORM, `pg` and Drizzle Kit. | TypeScript schema, server connection pool and one versioned SQL migration history. |
| Shared database | PostgreSQL 18; official `postgres:18-trixie` image for local development. | Five-year major support; named-volume persistence. Application access and account isolation follow in Phase 1. |
| Local database | IndexedDB through Dexie. | Primary working store for teams, players, new matches, recording and retained history, independent of login or connectivity. |
| Temporary UI state | Zustand. | Explicit recorder state shared across player, action, rink and detail controls. |
| Translation | next-intl with English and European Portuguese (`pt-PT`). | App Router/server/client localization from Phase 0, including cached offline messages. |
| Repository | One Next.js project at the repository root. | Keep setup focused on the translated shell; introduce feature folders only when needed. |
| Styling | Adjacent CSS modules imported as `st`; Grid and Flexbox. | Responsive layouts without requiring a styling framework. |
| Rink | SVG. | Simple geometry, scaling and pointer coordinate conversion. |
| PWA | Serwist/Turbopack 9.5.13, native esbuild 0.28.2, explicit asset precaching and waiting updates. | Cache the public `/app` shell independently of account pages. Keep updates waiting until app tabs/windows close. |
| Clock | Countdown display, configurable periods and persisted anchors. | Match time calculated independently of timer callbacks. |

Authentication and SQL libraries are implemented as described in [Account schema and flow](account-auth.md). Better Auth/adapter/CLI 1.7.8, Drizzle ORM 0.45.4, Drizzle Kit 0.31.11 and `pg` 8.23.1 are pinned. No email delivery, verification or email reset workflow is included. Serwist's Turbopack integration is verified against Next.js 16.4.0; see the [Phase 2 handoff](phase-2-handoff.md).

The root `compose.yaml` runs PostgreSQL only. It binds the configured host port to loopback and stores data in a named volume at `/var/lib/postgresql`. The root `.env` supplies server-only database and auth settings; `.env.example` documents local defaults. No database or auth secret uses a `NEXT_PUBLIC_` prefix. See [local setup](../README.md#local-postgresql).

## Current structure

Create folders only when the current phase uses them.

```text
src/
  app/
  client/
    auth/
    shell/
    i18n/
  i18n/
  messages/
    en.json
    pt-PT.json
  server/
    auth/
    db/
scripts/
drizzle/
docs/
```

Route groups organize layouts without becoming URL segments. Keep a single root layout so moving between account and recorder groups does not introduce avoidable full reloads. API handlers live outside UI route groups.

React Client Components live under `src/client`; route files in `src/app` compose them. Keep each component's CSS module beside it. Translation catalogs live in `src/messages`, and shared localization configuration lives in `src/i18n`.

No test suite or runner is included in the setup. Add tests only on explicit user request after a functioning version exists, targeting specific important behavior. Any authorized future tests belong in a root `tests` directory that mirrors `src`.

Use npm, one package manifest, one lockfile and one TypeScript configuration. Domain implementation, transport contracts, server folders and feature routes are deferred until an authorized feature needs them. The responsibilities below describe planned boundaries, not existing implementation. Separate packages require a concrete need and discussion with the user.

## Layer responsibilities

| Layer | Owns | Does not own |
| --- | --- | --- |
| App Router | Pages, layouts, route params and composition. | Domain rules or raw database access. |
| Route Handlers | HTTP parsing, session/account context and result mapping. | Business transactions and recorder state. |
| Client UI/Zustand | Visible creation/edit state, selection and display preferences. | Durable event records, credentials or pending-write persistence. |
| Client application | Local commands, replay validation and IndexedDB transaction boundaries. | HTTP retry implementation or PostgreSQL writes. |
| Local repositories | IndexedDB reads/writes and schema details. | User-facing workflows. |
| Sync coordinator | Ordered delivery, acknowledgement, reconciliation and errors. | Inventing domain corrections. |
| Server services | Authorization, business rules and PostgreSQL transactions. | React state or IndexedDB transactions. |
| Server repositories | Explicit account-scoped database queries and mutations. | Session discovery or workflow decisions. |
| Shared domain | Entity contracts, validation and deterministic derivation. | Frameworks, database clients or transport. |
| Shared contracts | Versioned commands, responses and transport validation. | SQL rows, browser state or credentials. |

Use focused repository interfaces where they enable workflow testing or composition. Do not force HTTP and database repositories into an identical interface or hide the distinction between local commit and remote acknowledgement.

## Account routing and ownership

Local hockey data belongs to a device-local workspace with a client-generated identity. It exists before sign-in. Server synchronization explicitly binds it to an authorized personal account; do not infer ownership from whichever user happens to sign in. Working server default is one personal account per user. Authentication `user` and `admin` roles do not bypass product-data ownership. Multiple members, invitations, organizations, billing and additional roles remain deferred.

The current authentication increment uses only Better Auth's generated schema and a minimal login/protected shell. Defer `app_account`, its provisioning flow and account-specific UI until product data needs ownership. See [account schema and flow](account-auth.md). The workspace model remains separate from Better Auth's credential `auth_account`.

The implemented Phase 1 routes are public `/sign-in` and protected `/`, with a shared header/main shell and authenticated sign-out. Phase 2 adds public `/app`, which is also the PWA launch target and does not call the session API to boot. The shared layout registers the production worker on all pages so initial visits can download the public app files. Existing login, protected-home and sign-out logic remains unchanged. Account settings and admin UI remain backlog items.

Scope local reads/writes to the local workspace. Scope server operations, receipts and queues to an explicitly bound authorized account. Online account pages and synchronization require a valid server session. Team/player management, game creation, roster selection and recording use IndexedDB without a server request. Local IDs do not wait for server provisioning.

Server session expiry or revocation pauses uploads without preventing local use. All later uploads recheck authorization. A game can exist locally before any server record or confirmed server revision exists; synchronization must support creating its prerequisites before accepting recording commands.

Explicit sign-out removes the associated private local dataset, with unsynced-work handling resolved before implementing cleanup. Retain the generic cached app so signed-out local use can start again. Connecting a different account must never automatically reassign or upload another account's records. See [offline access and sign-out](offline-sync.md#authentication-and-account-isolation).

## Offline application entry

Do not assume that prefetching an App Router page makes it reloadable offline. Navigation can require server component responses, and a server-authenticated layout can block initial access.

Provide one generic precached client application entry for all local hockey workflows. Online and offline operation use the same components and local save path. Team/player management and new-match setup belong here as later features, alongside recording and retained history. There is no prepared-games-only offline mode.

Start with a single cached document and browser-side navigation within it; do not introduce a second router package or a deep-link fallback framework without a concrete feature need. Product view changes must not depend on React Server Component responses. If deep links are added later, validate selection and map only local application document routes to the generic shell. Never return HTML fallbacks for APIs or RSC requests.

Precache the entry and the complete required feature asset graph, including lazy chunks for unvisited local views, CSS, fonts/icons and both catalogs. Do not cache account pages, personalized HTML, auth redirects or API responses. Keep boot independent of server authentication and locale reads. Defer updates during recording or saving. [Offline and sync](offline-sync.md) defines installation readiness, local persistence and failure handling.

The first increment caches generated JavaScript/CSS/font assets, public install icons and only the explicit public documents `/app`, `/manifest.webmanifest`, `/icon.svg` and `/favicon.ico`. The worker bypasses RSC/prefetch requests and does not provide generic HTML fallbacks. Document revisions include asset fingerprints and the entry/metadata source so uncommitted builds also invalidate changed documents. The client verifies the active worker's actual precache before reporting that application files are available offline; full readiness still requires the next local database increment. Registration is disabled during development. New workers wait for all controlled windows/tabs to close; the UI never forces activation or reload.

## Zustand rules

Use a store factory and provider scoped to the recorder/account lifecycle. Subscribe to focused selectors. Keep explicit draft transitions testable, whether expressed as a pure transition function or store actions.

No process-global mutable store shared across server requests. Server Components do not read or mutate Zustand. Initial server and browser rendering must agree; load IndexedDB-dependent state after the browser initializes.

The add-event draft is memory-only and exists only while its UI is open. Preferences may be persisted separately if required. Events, undo history and the outbox remain in IndexedDB.

## Localization

Use next-intl from Phase 0 with English and `pt-PT` catalogs. Keep the local application URL independent of locale. Store canonical domain values and API error codes; translate their presentation in the UI. Offline language switching uses local messages without a server refresh. See [Localization](localization.md).

## Sources

- [Next.js backend-for-frontend guidance](https://nextjs.org/docs/app/guides/backend-for-frontend).
- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps).
- [Zustand Next.js guidance](https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/nextjs.md).
- [next-intl App Router setup](https://next-intl.dev/docs/getting-started/app-router).
