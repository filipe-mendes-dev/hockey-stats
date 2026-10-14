# Benchline Stats

Responsive roller-hockey event recorder. Account-scoped data, a PostgreSQL-backed API and offline match recording are planned for later phases.

## Current state

Phase 0 provides one strict TypeScript Next.js application, a translated placeholder shell and saved English/European Portuguese selection. Domain code, command contracts and tests are deferred until needed. No API, authentication, database, service worker, recorder or synchronization is implemented.

## Setup

Use Node.js 24 and npm 11. The `.nvmrc` selects the supported Node major.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Language selection uses `localStorage` under `benchline.locale`; URLs stay unprefixed. Initial server rendering and hydration use English, then the browser restores the saved language and updates the document language. Both catalogs ship with the client. Storage restrictions allow switching for the mounted session but prevent saving across reloads.

```sh
npm run check
npm run start
```

`check` runs formatting verification, lint, typecheck and a production build. It does not run tests. `start` serves that build. Individual commands are `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck` and `npm run build`. CLI arguments pass through, for example `npm run dev -- --port 3001`.

## Project structure

The repository root is the application root. Run npm commands here. One `package.json`, lockfile and TypeScript configuration cover the application. The setup contains only the translated shell and its supporting code.

```text
src/
  app/                # Route pages and layouts
  client/
    shell/            # Interactive placeholder and adjacent CSS
    i18n/             # Client language provider
  i18n/               # Locale configuration and preference logic
  messages/           # English and pt-PT catalogs
```

Add domain and transport code only when an authorized feature needs it. Tests require explicit user instruction after a functioning version exists and should target specific important behavior. Separate packages and workspace scripts are unnecessary for the current prototype; discuss additional structure only when a concrete requirement needs it.

`next typegen` runs before typecheck and generates route and exact translation declarations. These generated files do not need to be committed. Typed translation keys and arguments remain available without a test suite.

See [Phase 0 verification and file report](docs/phase-0-handoff.md#setup-only-cleanup) for the current cleanup and non-test checks. The same document retains earlier verification as historical evidence.

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

Work stops after Phase 0. Later phases require separate authorization.
