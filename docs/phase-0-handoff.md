# Phase 0 handoff

Current scope, revised on 2026-10-14: one root Next.js application with a translated placeholder shell. No later phase is implemented.

## Current setup

- One npm package, lockfile and strict TypeScript configuration.
- App Router pages in `src/app` and Client Components in `src/client`, with adjacent CSS modules.
- English and European Portuguese catalogs in `src/messages`.
- next-intl typed keys/arguments, locale fallback and saved language selection.
- Formatting, lint, typecheck and production-build scripts.

Domain entities, recovery validation, command contracts, tests and test tooling are absent. Add feature code only when an authorized feature needs it. Tests require explicit user instruction after a functioning version exists and must target specific important behavior.

## Setup-only cleanup

The original Phase 0 request included minimal recovery validation and contracts for the first later recording slice. The user subsequently narrowed this branch to setup only. All domain/contract code and tests were removed, including localization tests and compile-time test assertions. Vitest, its configuration, test scripts and the direct test-only ICU parser dependency were removed. next-intl still uses its own required translation dependencies.

The translated shell and its language preference implementation were left unchanged. Git history and product planning documents were preserved. Planned domain rules remain in `docs/domain-model.md` as future requirements.

### Verification after cleanup

| Check | Result |
| --- | --- |
| `npm ci --no-audit` | Passed. |
| `npm run format:check` | Passed. |
| `npm run lint` | Passed. |
| `npm run typecheck` | Passed. |
| `npm run build` | Passed. |
| `git diff --check` | Passed. |

`npm run check` now runs only formatting verification, lint, typecheck and production build. No tests or browser automation were run during this cleanup.

Earlier iterations passed 88 tests and Chromium checks for both languages, persistence, fallback and hydration. Those results are historical evidence, not a current test suite. The old workspace layout and recovery implementation have been removed.

The previously reported five development linting dependency findings remain unresolved, and npm still reports the ESLint 9 deprecation notice. No new security audit was run during cleanup.

### File-by-file cleanup report

| File | Change |
| --- | --- |
| `src/domain/entities.ts` | Remove premature entity interfaces. |
| `src/domain/events.ts` | Remove the recovery event contract. |
| `src/domain/index.ts` | Remove domain exports. |
| `src/domain/validation.ts` | Remove recovery runtime validation. |
| `src/contracts/index.ts` | Remove the recovery command and transport validator. |
| `tests/domain/validation.test.ts` | Remove recovery tests. |
| `tests/contracts/index.test.ts` | Remove command tests. |
| `tests/i18n/messages.test.ts` | Remove catalog tests. |
| `tests/i18n/messages.typecheck.ts` | Remove compile-time test assertions. |
| `tests/i18n/preference.test.ts` | Remove preference tests. |
| `vitest.config.ts` | Remove the test runner configuration. |
| `package.json` | Remove test scripts and test-only development dependencies; keep a non-test check command. |
| `package-lock.json` | Remove the unused test dependency tree. |
| `tsconfig.json` | Remove the test-folder include. |
| `.gitignore` | Remove the test coverage ignore entry. |
| `.prettierignore` | Remove the test coverage ignore entry. |
| `eslint.config.mjs` | Remove the test coverage ignore entry. |
| `AGENTS.md` | Make future test placement conditional and require inspecting aggregate scripts before running them. |
| `README.md` | Document the setup-only source tree and non-test commands. |
| `docs/architecture.md` | Show current folders and distinguish future feature responsibilities. |
| `docs/product-requirements.md` | Limit Phase 0 to setup and the translated shell. |
| `docs/development-plan.md` | Remove domain/contracts/tests from Phase 0 and gate later test scenarios on explicit authorization. |
| `docs/backlog.md` | Defer feature folders until an authorized feature needs them. |
| `docs/localization.md` | Remove claims of an existing automated catalog suite while retaining typed messages. |
| `docs/phase-0-handoff.md` | Replace obsolete layout reports with the current scope, verification and a short history. |
