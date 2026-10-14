# Benchline Stats

Responsive roller-hockey event recorder with account-scoped data, a PostgreSQL-backed API and offline match recording.

## Current state

Planning and documentation only. No application, dependency setup or database has been implemented. The earlier local-only React/Vite proposal is superseded by the architecture below.

## Development context

Read [AGENTS.md](AGENTS.md) before changing the repository.

| Document                                             | Purpose                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| [Product requirements](docs/product-requirements.md) | Product scope and acceptance scenarios.                                         |
| [Architecture](docs/architecture.md)                 | Stack, account routing, ownership boundaries and repository structure.          |
| [Domain model](docs/domain-model.md)                 | Entity contracts, event variants, ordering and lineup corrections.              |
| [Recorder UX](docs/recorder-ux.md)                   | Draft lifetime, interaction paths, required details and clock behavior.         |
| [Offline and sync](docs/offline-sync.md)             | Local persistence, API protocol, account isolation and failures.                |
| [Development plan](docs/development-plan.md)         | Incremental phases, tests, acceptance criteria and first implementation prompt. |
| [Backlog](docs/backlog.md)                           | Deferred work and decisions required before dependent phases.                   |

Implementation remains subject to approval of the first phase. Documentation changes do not authorize application implementation.
