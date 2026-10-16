# Development instructions

## Scope and communication

- Respond in English unless Portuguese is explicitly requested.
- Keep responses concise and report changes file by file.
- Split authorized work into small, reviewable increments. Before each increment, explain its scope; afterward, explain what changed, why it was needed and how it was checked. Do not combine unrelated steps into a large handoff.
- Choose the simplest approach that satisfies the current requirement. Add complexity only when strictly necessary for a concrete need; discuss the need, trade-offs and simpler alternatives with the user before adding it.
- If no edits are needed, reply exactly `no changes to <file_name>`.
- Change only requested logic. Explain and justify necessary changes outside that scope.
- Implement only the authorized phase. Run non-test acceptance checks; test work requires explicit user instruction under the testing policy below.
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
- Put web components in PascalCase files with adjacent `ComponentName.module.css`, imported as `st`; avoid static inline JSX styles. Put component interfaces in adjacent `ComponentName.interfaces.ts` files when needed.
- Put reusable controls/layout in `src/client/components`, complete page views in `src/client/pages` and feature-owned shared state in `src/client/features`. App Router entries compose the corresponding pages directly; do not re-export other route entries or switch page views through a central pathname conditional.
- Keep React Client Components under `src/client`; App Router files compose them from `src/app`.
- Keep translation catalogs under `src/messages`.
- When explicitly requested, put tests in the root `tests` directory and mirror paths relative to `src`, such as `src/i18n/messages.ts` with `tests/i18n/messages.test.ts`. Keep compile-time assertions there too. Do not create test folders in advance.
- Handle long text, narrow screens, text scaling and touch/keyboard access.
- Add user-facing text to both catalogs; keep canonical domain values untranslated.
- Do not use emoji in code comments.

## Verification and handoff

- Ignore tests by default. Do not read, add, modify or run tests unless the user explicitly asks. Preserve existing tests and their setup unless changes are requested.
- Add tests only after a functioning version exists and only for specific important behavior requested by the user. Avoid speculative tests and broad coverage work during prototyping.
- Historical testing requirements in phase plans do not authorize test work. Follow the user's current testing instructions.
- Run relevant non-test checks. Inspect aggregate scripts before running them; do not run any that include tests unless explicitly requested. Report failed, skipped or unavailable checks accurately.
- Verify offline/service-worker behavior against a production build.
- Mark phases complete only after acceptance criteria pass.
- Prefix branches with `feat/` for features or `fix/` for bug fixes. Never use `codex/`.
