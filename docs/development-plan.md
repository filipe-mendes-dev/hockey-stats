# Development plan

## Status and scope

Planning baseline revised on 2026-10-14. Phases 0 and 1 are complete. Phase 1 reflects the agreed database/authentication scope; workspace-owned product APIs and command receipts move to Phase 3. Later phases remain unimplemented and require separate authorization.

Use Next.js, IndexedDB as the primary local working store and an authenticated PostgreSQL API for optional synchronization. Add English/Portuguese support from Phase 0. All hockey workflows, including new-match setup and team/player management, must work offline as their features are implemented. Accounts are required only for server/account operations.

| Phase | Status |
| --- | --- |
| 0. Project foundations | Complete. Setup-only scope; see [verification](phase-0-handoff.md#setup-only-cleanup). |
| 1. Authentication and database foundation | Complete. PostgreSQL, modular auth schema/migrations, username/password login, admin creation commands and protected shell verified. |
| 2. Offline application foundation | In progress. PWA/Serwist and Dexie/workspace initialization implemented; local navigation feasibility and device checks remain. |
| 3. Thin synchronized recording slice | Not started. |
| 4. Teams and roster setup | Not started. |
| 5. Simple countdown clock | Not started. |
| 6. Independent lineup movements | Not started. |
| 7. Event variants and mandatory details | Not started. |
| 8. Optional field coordinates | Not started. |
| 9. Alternate entry paths | Not started. |
| 10. Historical corrections | Not started. |
| 11. Offline and synchronization hardening | Not started. |
| 12. Responsive and observer validation | Not started. |

Update a phase status only after its acceptance criteria pass. Record the actual checks and remaining limitations in the implementation handoff. No phase includes backup/export unless separately requested.

Phase 0 is setup-only by user request. Domain implementation, command contracts and test tooling are deferred. Testing scenarios in later phases are candidates for important behavior after a functioning version exists; they do not authorize adding or running tests without an explicit user request.

## Phase 0. Project foundations

- Objective: establish one minimal Next.js/TypeScript project and translated placeholder shell.
- Dependencies: human approval for Phase 0.
- Deliverables: a root Next.js App Router project and placeholder shell; strict TypeScript, linting, formatting, typecheck and production-build scripts. Keep next-intl, English/pt-PT catalogs, typed keys and a persisted language selector without locale URL prefixes. Use one npm package and TypeScript configuration. No domain implementation, transport contracts, tests or test runner belong in this setup phase. This supersedes the original workspace, recovery-validation and test-tooling requirements by user request.
- Acceptance: clean install, formatting, typecheck, lint and production build pass. The shell renders in both languages and remembers selection. No domain implementation, transport contracts, test suite, API feature, database, auth integration, worker, event UI or sync engine is implemented. Existing Git metadata and planning documents remain intact.

Earlier test and browser verification is preserved as history in the handoff. See [Setup-only cleanup](phase-0-handoff.md#setup-only-cleanup) for the Phase 0 non-test checks and removed files. That implementation stopped after Phase 0; the subsequent PostgreSQL increment is described below.

## Phase 1. Authentication and database foundation

The agreed phase adds PostgreSQL 18 local infrastructure, a persistent Compose volume, readiness check, environment configuration, modular Drizzle schema/migrations, Better Auth username/password login, admin-created users and a minimal header/main shell. Use public `/sign-in` and protected `/`, with sign-out in the authenticated header. Public signup, email infrastructure, account settings and the admin tab/screen are excluded. The earlier workspace provisioning, scoped product API and command-receipt requirements move to Phase 3, where actual product data and synchronization need them. See the [handoff](phase-1-handoff.md) for completed checks.

Phase 1 completed on 2026-10-14. Its migrations, production browser flow, role permission checks and schema modularity checks passed. See [authentication verification](phase-1-handoff.md#authentication-increment). Settings and admin navigation/UI remain in the backlog; workspace ownership and receipts belong to Phase 3.

- Objective: establish the database and authenticated application entry before product workflows.
- Dependencies: Phase 0; Better Auth with username/admin plugins, Drizzle ORM, Drizzle Kit and PostgreSQL. No email infrastructure is required.
- Deliverables: persistent PostgreSQL Compose setup; modular generated auth schema and versioned SQL migrations; server-only database/auth configuration; normal/admin permissions; first-admin bootstrap and authenticated user creation commands; login/protected pages and shared header with sign-out; both language catalogs.
- Verification: manual migration, login/reload/sign-out and permission checks; formatting, lint, typecheck and production build. No automated tests are required or authorized by this phase.
- Acceptance: the database retains data across container recreation; auth migrations apply and generation preserves the central schema exports; username/password login establishes a database session and survives page reload; anonymous visitors cannot access the protected home; sign-out invalidates the session; only an admin can create normal users; public signup and role escalation are denied; both locales fit the supported narrow-screen layout; all non-test project checks pass.

## Phase 2. Offline application foundation

The user clarified that the normal application must support every hockey workflow offline, including new-match setup and local teams/players. This supersedes the prepared-games-only `/offline` design. Phase 2 establishes infrastructure only; product features follow in later branches/phases. Personal-device local use requires no account and survives connection loss, session expiry and app restart. Explicit sign-out must clear private local data; unsynced-work safeguards remain to be agreed before implementing destructive cleanup. See [offline policy](offline-sync.md) and the [Phase 2 proposal](phase-2-offline-proposal.md).

- Objective: prove installation, offline launch/navigation, local database initialization and safe updates before adding product workflows.
- Dependencies: Phase 1. Selected Serwist/Turbopack 9.5.13 and esbuild 0.28.2, verified with Next.js 16.4.0.
- Deliverables: manifest and install icons; one generic precached local application entry independent of auth; explicit required-asset precaching and readiness/error state; local-only navigation structure with no product workflows; Dexie initialization/versioning and non-secret local workspace identity; both catalogs; prompted worker update handling. Keep private account/API routes outside the cached shell.
- Exclusions: no team/player/game CRUD, prepared-game fixtures, recorder/add-event shell, Zustand demo, domain tables, outbox protocol, server sync or account data-deletion flow. Add feature schemas and state only when later phases use them. A temporary non-domain storage diagnostic may establish persistence without becoming a product feature or production data source.
- Non-test verification: production cold launch/reload with network disabled and no session; navigation to an unvisited local placeholder view; local language switching; manual local persistence check and storage-failure handling; interrupted cache installation; waiting worker and safe activation. Run relevant non-test project checks. No automated tests are authorized.
- Acceptance: the installed app launches without auth/API/RSC requests needed for local use; all required assets are cached before readiness is shown; local initialization and reload work without a server; both languages work offline; failed installation/storage does not claim success; updates do not force reload while the app is busy. No product features are implemented. Physical-device checks are recorded for the supported mixed-device target, including limitations when devices are unavailable.

The first authorized increment adds manifest/icons, a public `/app` placeholder, production worker registration, explicit precaching, file-cache status/retry and waiting-update feedback. Production browser checks cover offline boot/reload, local language switching, failed installation/retry, cache boundaries and native waiting activation. See the [PWA increment handoff](phase-2-handoff.md).

The storage increment adds Dexie 4.4.6, versioned metadata, a transactional local workspace identity, runtime validation, storage failure/retry and blocked/closed connection feedback. The `/app` offline-ready status requires cached files and successful storage initialization, with persistent-storage retention reported separately. See [storage verification](phase-2-storage-handoff.md). Local navigation feasibility and physical-device checks remain pending; Phase 2 stays in progress. No recorder or sync features are included.

## Phase 3. Thin synchronized recording slice

- Objective: prove local durability and remote acknowledgement in one narrow workflow.
- Dependencies: Phase 2.
- Deliverables: minimum local team/player/game/roster setup without an account or network; player-first recovery with mandatory subtype; recent timeline; durable undo; atomic local changes and sync intent. Add personal server workspace provisioning, explicit local/account binding, an account-scoped API, prerequisite creation delivery, PostgreSQL command handling, persisted receipts and reconciliation. Build and verify the local slice before adding its server synchronization. These are later product features, not Phase 2 infrastructure.
- Tests: online save; offline save/reload; reconnect; lost acknowledgement after SQL commit; duplicate tap/delivery; local write failure; undo before and after acknowledgement; a later local edit surviving an earlier acknowledgement.
- Acceptance: without a network or account, create the minimum team/player/game/roster, record a recovery and retain it and undo after reload. After explicit account binding and reconnect, upload prerequisites and obtain exactly one server event. Each server workspace authorizes reads/writes; another user cannot access it by guessing an ID. A committed receipt survives server restart and duplicate delivery applies one mutation. Saved locally and synced are distinct. A rejected or failed upload preserves local work. This is a recovery-only slice, not all V1 events.

## Phase 4. Teams and roster setup

- Objective: expand minimal setup into practical multi-team management.
- Dependencies: Phase 3.
- Deliverables: reusable player identity, team memberships, team-specific numbers, game metadata, roster selection, starter selection and game snapshots through local/API command paths.
- Tests: player on two teams; different numbers per roster; membership archive; later player rename; invalid workspace/account/game references; offline team/player creation; new-game/roster setup and reload without connectivity; subsequent prerequisite synchronization.
- Acceptance: either squad can select the same player. Historical names/numbers remain stable. Management and setup work locally without login or network, including creating a new game. Unavailable remote data is not falsely shown as local.

## Phase 5. Simple countdown clock

- Objective: add optional match time without a clock-reconciliation subsystem.
- Dependencies: Phase 4.
- Deliverables: configurable periods/duration; countdown by default; start/pause/resume; manual correction; persisted elapsed anchor; explicit period change; event time capture. Persist and synchronize user clock mutations, not UI ticks.
- Tests: paused/running reload; throttled UI callbacks; correction leaving old event times unchanged; missing duration/time; period change; zero boundary; undo of a control using a fresh anchor.
- Acceptance: countdown is calculated from an anchor, so missed callbacks do not accumulate drift. It pauses at zero without automatic period/lineup changes. Non-movement events remain recordable without time. Movement time can be captured or entered manually without requiring a running clock. No time-source field or advanced drift diagnostics is added.

## Phase 6. Independent lineup movements

- Objective: derive the actual variable lineup from canonical history.
- Dependencies: Phase 5.
- Deliverables: starter replay, active/bench display, independent player-in/out with required period/game time, automatic known-clock capture or manual entry, and durable undo through the API-backed command path.
- Tests: missing movement time rejected locally/by API; manual time without running clock; duplicate live movement; out without replacement; reload; period transition; replay equivalence; stale-writer conflict.
- Acceptance: taking one player off decreases the count without requiring another player. Untimed movement cannot commit or sync, and edits cannot clear its time. Browser/server replay agrees. No regulation player count is hard-coded.

## Phase 7. Event variants and mandatory details

- Objective: add the remaining recorder vocabulary.
- Dependencies: Phase 6; confirm shot edge cases.
- Deliverables: shots/outcomes, losses/reasons, cards/colours and player-attributed fouls. Recovery subtype stays mandatory. Expand shared discriminated unions and transport validators incrementally.
- Tests: required fields, incompatible fields, bench cards, foul without player rejection, missing optional context and card/movement independence.
- Acceptance: all event types persist and synchronize. A blue card leaves lineup unchanged. A shot without time/coordinates is valid. Recovery subtype and foul player cannot be skipped.

## Phase 8. Optional field coordinates

- Objective: capture accurate position without making it mandatory.
- Dependencies: Phase 7.
- Deliverables: SVG rink, transformed normalized coordinates, optional position editing/removal and explicit period attack direction.
- Tests: known points across scaling, rotation and letterboxing; outside-rink taps; absent coordinates; movement restrictions.
- Acceptance: synthetic point conversion is within one CSS pixel across tested layouts. Every existing event path still works without field interaction. No zones or heatmaps are added.

## Phase 9. Alternate entry paths

- Objective: add action-first and field-first to the established player-first workflow.
- Dependencies: Phase 8.
- Deliverables: shared Zustand transitions, all required-detail paths, back/cancel behavior and one canonical submission path.
- Tests: transition matrix, canonical equivalence, changed action clearing incompatible fields, double taps, visible failed-save retry and draft cleanup.
- Acceptance: equivalent selections have equivalent persisted meaning through every path. Cancel writes nothing. Closing the UI retains no hidden draft. Intentional fresh repeated events remain possible.

## Phase 10. Historical corrections

- Objective: repair mistakes without hidden lineup changes or client/server divergence.
- Dependencies: Phase 9.
- Deliverables: edit player/details/position/time/period, soft delete, explicit historical placement, starter correction, lineup preview, contradiction diagnostics and revision-checked inverse operations.
- Tests: deleted movement; starter change; changed player; reorder; unchanged order after time edit; movement time clearing rejected; conflict after remote change; accepted contradictory correction; durable undo before/after sync.
- Acceptance: PRD scenario 8 passes locally and after synchronization. Both sides preserve flagged redundant movements as no-ops. No correction silently rewrites another event or discards pending local work.

## Phase 11. Offline and synchronization hardening

- Objective: validate failure recovery across realistic match sessions.
- Dependencies: Phase 10.
- Deliverables: actionable storage/auth/conflict UI; retry controls; migration fixtures; tab safeguards; safe update activation; complete application readiness; sign-out cleanup with agreed unsynced-work safeguards; tested download cursors and pending-projection reconciliation.
- Tests: offline team/player and new-match setup followed by a full match; restart/reconnect; acknowledgement loss; quota failure; interrupted transaction; SQL/IndexedDB migration failure; blocked upgrade; worker update; expired/revoked session; explicit sign-out cleanup with pending work; account switch; second writer; paginated download; offline language switch preserving draft/clock/pending records.
- Acceptance: failures cause no partial local/server mutation, duplicate command effect or false synced status. Pending data survives reload, connection loss, expiry and failed upload. Explicit sign-out removes private data only through the agreed cleanup/discard flow. Another account cannot adopt or upload it. No hockey workflow needs a live API.

## Phase 12. Responsive and observer validation

- Objective: verify recording speed and correctness on supported devices.
- Dependencies: Phase 11.
- Deliverables: phone/tablet/desktop layout refinements, long-text handling, accessibility and observer-tested interactions.
- Tests: all PRD scenarios in both languages; Chromium/Firefox/WebKit production-build flows; 360 CSS-pixel phone; tablet portrait/landscape; desktop; increased text size; long Portuguese labels; keyboard/touch; physical iPadOS checks if tablets are supported release devices.
- Acceptance: all core flows work without a mouse/keyboard and without horizontal scrolling at the minimum viewport. Observers complete the documented tap paths with no extra mandatory screens. Report completion times, attribution mistakes and missed events from a scripted match exercise.

## Deferred test scenarios

These are planning references, not required setup work or permission to run tests. Apply them only after a functioning version exists and the user explicitly requests tests for a specific important behavior.

| Layer | Candidate evidence when authorized |
| --- | --- |
| Unit | Event validation, lineup replay/diagnostics, clock calculations and draft transitions. |
| Localization | Typed keys, catalog/argument parity, locale preference, hydration and both-language UI. |
| IndexedDB integration | Atomic event/outbox/journal writes, failed transaction, retry, acknowledgement reconciliation, migrations and undo. |
| PostgreSQL/service integration | Account scoping, relationships, transaction rollback, optimistic revisions, idempotency receipts and tombstones. |
| Browser E2E | Real production worker, offline boot/navigation, sync/reload, account switching, touch workflows and viewport behavior. |

Use real browser IndexedDB and a real isolated PostgreSQL test database for acceptance evidence. In-memory substitutes may speed unit checks but cannot establish worker behavior, database constraints or storage durability.

Use deterministic injected clock/network scenarios for failure cases. Do not rely solely on disconnecting a browser or sleeping in a test. Include API failure while browser connectivity still reports online.

## First implementation prompt

Execute only after approval:

> Implement Phase 0 only for Benchline Stats in `hockey-stats`. Read AGENTS.md and the linked product, architecture and development-plan documents. Preserve existing files and Git metadata.
>
> Set up one minimal strict-TypeScript Next.js App Router application at the repository root. Add linting, formatting, typecheck and production-build scripts. Add next-intl with English/pt-PT catalogs, typed keys and a persisted language selector. Keep URLs unprefixed. Render only the translated placeholder shell and language control.
>
> Do not implement domain entities, recovery validation or transport contracts in this setup phase. Add them only when an authorized feature needs them.
>
> Do not add tests or test tooling. Follow AGENTS.md and require explicit user instruction for tests after a functioning version exists.
>
> Do not implement API features, PostgreSQL, authentication, IndexedDB, service workers, recorder UI, sync, additional event variants or backup/export. Run the Phase 0 checks, report changes file by file and stop after Phase 0.
