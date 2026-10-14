# Development instructions

## Scope and communication

- Respond in English unless Portuguese is explicitly requested.
- Keep responses concise and report changes file by file.
- If no edits are needed, reply exactly `no changes to <file_name>`.
- Change only requested logic. Explain and justify necessary changes outside that scope.
- Implement only the authorized phase and run its acceptance checks.
- Update affected docs when agreed requirements change; resolve conflicts before implementing dependent behavior.
- Do not install packages or implement application features for a documentation-only request.

## Read for the task

| Task | Required context |
| --- | --- |
| Start a phase | [Product requirements](docs/product-requirements.md) and that phase in [Development plan](docs/development-plan.md). |
| Place code or change layer dependencies | [Architecture](docs/architecture.md). |
| Entities, events, validation, lineup or undo | [Domain model](docs/domain-model.md). |
| Recorder UI, drafts, clock or touch interactions | [Recorder UX](docs/recorder-ux.md). |
| API, account scope, persistence, sync or /offline | [Offline and sync](docs/offline-sync.md). |
| User-facing text, language selection or formatting | [Localization](docs/localization.md). |
| Dependency selection or scope expansion | [Backlog](docs/backlog.md). |

- Apply `repository-service-boundaries` when designing/changing repositories, services and transactions.
- Apply `db-service-test-patterns` when writing/reviewing persistence-backed service tests.

## Code conventions

- Use strict TypeScript. Never use `any`; accept weak/external values as `unknown` and narrow them.
- Prefer interfaces. Use aliases when needed, such as discriminated unions.
- Prefer named functions and arrow callbacks.
- Validate incoming transport and stored values at runtime.
- Inject time and ID generation where deterministic workflow tests require them.
- Put web styles in adjacent `styles.module.css`, imported as `st`; avoid static inline JSX styles.
- Handle long text, narrow screens, text scaling and touch/keyboard access.
- Add user-facing text to both catalogs; keep canonical domain values untranslated.
- Do not use emoji in code comments.

## Verification and handoff

- Run checks relevant to the change/phase. Report failed or unavailable checks.
- Verify offline/service-worker behavior against a production build.
- Mark phases complete only after acceptance criteria pass.
- Prefix branches with `feat/` for features or `fix/` for bug fixes. Never use `codex/`.
