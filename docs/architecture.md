# Architecture

Status: Phase 0 contains setup and a translated placeholder shell only. Domain implementation, transport contracts and tests have been removed by user request. The stack below describes the target architecture; API, persistence, authentication, offline boot and recorder workflows remain unimplemented.

## Stack

| Area | Decision | Reason |
| --- | --- | --- |
| Web framework | Next.js App Router with TypeScript and React. | Account-scoped layouts and an early API are planned. Avoid a later framework migration. |
| API | Next.js Route Handlers with separate server services and repositories. | One application deployment with explicit HTTP, workflow and storage boundaries. |
| Shared database | PostgreSQL. | Authoritative accepted data, relationships and account isolation. |
| Local database | IndexedDB through Dexie. | Durable offline working data and queued operations. It complements PostgreSQL. |
| Temporary UI state | Zustand. | Explicit recorder state shared across player, action, rink and detail controls. |
| Translation | next-intl with English and European Portuguese (`pt-PT`). | App Router/server/client localization from Phase 0, including cached offline messages. |
| Repository | One Next.js project at the repository root. | Keep setup focused on the translated shell; introduce feature folders only when needed. |
| Styling | Adjacent CSS modules imported as `st`; Grid and Flexbox. | Responsive layouts without requiring a styling framework. |
| Rink | SVG. | Simple geometry, scaling and pointer coordinate conversion. |
| PWA | Service worker with explicit offline-shell caching and prompted updates. | Installation alone does not provide offline routing or persistence. |
| Clock | Countdown display, configurable periods and persisted anchors. | Match time calculated independently of timer callbacks. |

Authentication, database-access and worker integration libraries are selected at the gates in [Backlog](backlog.md).

## Current structure

Create folders only when the current phase uses them.

```text
src/
  app/
  client/
    shell/
    i18n/
  i18n/
  messages/
    en.json
    pt-PT.json
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

Working default: a user owns one personal account. Team and player data belongs to that account. Multiple members, invitations, organizations, billing and roles beyond ownership remain deferred unless requested.

Use `/accounts/[accountId]/...` routes so scope stays explicit. Scope every server query and local dataset to the account, including operation receipts and pending mutations. Resolve authorized scope from the session; never trust route IDs alone.

Online account pages require a valid server session. Sign-in, account provisioning, team/player management and game/roster preparation require connectivity. A previously prepared game remains recordable at `/offline` without refreshing the session.

Offline access means continuing with already available local account data. It is not a fresh server authorization decision. Server revocation cannot instantly remove data from a disconnected device. All later uploads must recheck current authorization.

Signing out locks local account views and clears transient state. Pending work stays in its account namespace. Signing in as another user must not show or upload that work under the new account. Detailed retention controls remain a later account-management task.

## /offline

Do not assume that prefetching an App Router page makes it reloadable offline. Navigation can require server component responses, and a server-authenticated layout can block initial access.

Provide an explicit, generic precached `/offline` entry. It supports selecting a prepared game, recording, lineup movements, clock controls, timeline, undo and historical corrections from saved roster/configuration/history. Account management, team/player creation, game creation, roster expansion and uncached remote browsing are unavailable there.

Online recorder URLs fall back to `/offline` with validated selected account/game identity when the network is unavailable. Reuse the same recorder components and local command path. Do not cache personalized account pages or API responses indiscriminately.

Cache the `/offline` entry, required assets and both language catalogs. Keep its boot independent of server authentication and locale reads. Defer service-worker updates during recording or saving. [Offline and sync](offline-sync.md) defines preparation and failure handling.

## Zustand rules

Use a store factory and provider scoped to the recorder/account lifecycle. Subscribe to focused selectors. Keep explicit draft transitions testable, whether expressed as a pure transition function or store actions.

No process-global mutable store shared across server requests. Server Components do not read or mutate Zustand. Initial server and browser rendering must agree; load IndexedDB-dependent state after the browser initializes.

The add-event draft is memory-only and exists only while its UI is open. Preferences may be persisted separately if required. Events, undo history and the outbox remain in IndexedDB.

## Localization

Use next-intl from Phase 0 with English and `pt-PT` catalogs. Keep URLs independent of locale, including `/offline`. Store canonical domain values and API error codes; translate their presentation in the UI. Offline language switching uses local messages without a server refresh. See [Localization](localization.md).

## Sources

- [Next.js backend-for-frontend guidance](https://nextjs.org/docs/app/guides/backend-for-frontend).
- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps).
- [Zustand Next.js guidance](https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/nextjs.md).
- [next-intl App Router setup](https://next-intl.dev/docs/getting-started/app-router).
