# Architecture

One strict-TypeScript Next.js App Router application contains the browser UI and authenticated sync API. Keep the current direct functions and feature folders. Repositories own database operations; services own business workflows and transaction boundaries.

## Stack and responsibilities

| Area                            | Implementation                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------- |
| Routing and server delivery     | Next.js App Router with thin route entries and Route Handlers.                  |
| Browser views                   | React client components with adjacent CSS modules and interfaces.               |
| Domain and transport validation | Shared Zod schemas and pure Match rules.                                        |
| Local durability                | Dexie/IndexedDB with one dataset, metadata and one shared outbox.               |
| UI query state                  | TanStack Query reading IndexedDB; no durable Query mutation queue.              |
| Recorder selection              | One temporary Zustand draft store per mounted recorder.                         |
| Shared persistence              | PostgreSQL through Drizzle ORM and `pg`.                                        |
| Authentication                  | Better Auth username/password, database sessions and restricted admin creation. |
| Offline delivery                | Serwist production worker with explicit generic HTML/RSC precaching.            |
| Localization                    | next-intl with bundled English/pt-PT catalogs.                                  |

Installed versions belong in `package.json` and the lockfile. Setup and commands are in the [README](../README.md).

## Source layout

```text
src/
  app/                 Route entries, layouts, auth/sync handlers and manifest
  client/
    components/        Reusable controls and layouts
    pages/             Complete named page views
    features/          Account, Players, Teams, Matches and shared synchronization
    storage/           Lazy Dexie connection, migrations, status and notifications
    query/             TanStack Query provider
    pwa/               Worker/cache readiness and update feedback
    i18n/              Client locale provider
  domain/              Entity schemas, form inputs and pure Match logic
  contracts/           Shared versioned sync contracts
  server/
    auth/              Better Auth configuration and session checks
    db/                SQL schema modules, pool and transaction type
    features/          Account-scoped repositories and transactional workflows
  worker/              Service worker and full offline route-payload handling
  i18n/                Supported locales, catalogs and saved preference
  messages/            English and Portuguese JSON catalogs
  offline-pages.ts     Explicit generic offline route allowlist
scripts/               Interactive account creation helpers
drizzle/               SQL migrations and generated metadata
```

App Router entries compose named pages directly. Do not re-export other route entries or select views through a central pathname switch. Reusable controls belong in `client/components`; feature-specific forms/state stay in their feature. Queries and mutations retain separate folders.

## Workflow boundaries

1. A page/form collects input and uses shared validation for feedback.
2. A query reads the local repository. A mutation calls the local service with `networkMode: always`.
3. The service validates current account/domain state and commits records, history if needed, and outbox commands in one IndexedDB transaction.
4. `localDataEvents` notifies this tab and other tabs to invalidate appropriate queries.
5. One foreground coordinator pushes the shared queue, applies durable acknowledgements, then downloads accepted collections.
6. A Route Handler authenticates the request and validates its expected owner and transport payload.
7. The server command service reserves a receipt and calls the feature workflow within one PostgreSQL transaction.

There is no transaction spanning IndexedDB and PostgreSQL. Retry-safe receipts bridge delivery failures. [Offline and sync](offline-sync.md) describes the concrete protocol.

## Shared and feature-owned logic

`domain/matches/matchRules.ts` owns eligibility, lineup and powerplay guards. `derivedMatchState.ts` derives score, availability and penalties. `matchControl.ts` calculates clock/lifecycle transitions. These functions have no React/database dependencies and are shared by UI selectors and transactional services.

Repositories query and map stored rows. Services coordinate meaningful actions such as starting a Match, adding an event or undoing it. Keep explicit insert/update methods. Do not introduce repository factories, database providers, per-table queues, generic CRUD registries or a general sports engine without a concrete requirement.

Zod validates form inputs, unknown stored data and transport boundaries. TypeScript contracts, runtime validation and Dexie keys/indexes serve different purposes; `stores()` does not validate every property.

## Runtime state

- IndexedDB owns working entities, local undo history and durable operations.
- TanStack Query owns temporary read/mutation UI state and is invalidated after writes and synchronization.
- Zustand owns only the open recorder draft. It never holds the only copy of a committed event.
- `useSyncExternalStore` subscribes React to database, sync and locale modules whose state also changes outside React.
- A DOM event refreshes this tab. BroadcastChannel notifies other tabs on the same origin. These notifications carry invalidation hints, not authoritative records or credentials.

Web Locks serialize synchronization across tabs. IndexedDB transactions and server expected revisions enforce data consistency. Recorder-tab exclusivity and automatic multi-device conflict merging are not implemented.

## Account and offline boundaries

One metadata record binds the local dataset to its authenticated owner. There are no workspaces or per-player local owner fields. PostgreSQL entities and receipts are scoped to the authenticated user; metadata never authorizes an API request.

The public static `/app` pages contain generic UI only. Local account setup gates hockey features after initial online sign-in. Session expiry does not prevent local use. Server-dependent account pages and APIs are outside offline caching.

See [Account authentication](account-auth.md), [Domain model](domain-model.md), [Recorder UX](recorder-ux.md) and [Localization](localization.md) for their respective decisions.
