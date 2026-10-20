# Development plan and prototype status

Updated 2026-10-19. This branch expanded the original thin recording slice to include Teams, Match setup, clock, event variants, powerplay and completion. Older phase-by-phase proposals no longer describe delivery order. Current requirements live in the canonical documents linked from the [README](../README.md#documentation).

## Implemented

| Area               | Current delivery                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Foundations        | Strict TypeScript, Next.js, shared controls, dark prototype layout and English/pt-PT.                                               |
| Authentication/SQL | Username/password, restricted admin creation, PostgreSQL, Drizzle migrations and owner-scoped APIs.                                 |
| Offline foundation | Production precaching, fixed query routes, IndexedDB, storage feedback and safe waiting updates.                                    |
| Players/Teams      | Offline create/list/details, Team editing and multi-select TeamPlayer assignment/field editing.                                     |
| Match setup        | Offline creation, incomplete call-ups, pre-start edits, starter/period configuration and Start.                                     |
| Live Match         | Recovery/loss/shot/foul/card, paired substitution, powerplay queue/completion, fifth-player entry, score and timeline.              |
| Clock/lifecycle    | Countdown anchor, start/pause/adjust, explicit period advancement and completed summary.                                            |
| Synchronization    | One outbox/coordinator, dependency/revision chains, durable receipts, full downloads, blocked feedback and local latest-event Undo. |

The implemented feature scope is ready for prototype branch review after the checks below. It is not a claim of complete V1 or cross-device production readiness. Do not start another phase automatically.

## Verification evidence

Prior increments used production browser builds, browser IndexedDB and local PostgreSQL. No automated tests were authorized or run.

- Offline creation/reload/navigation, first-use ownership and explicit prototype Player import/decline.
- Atomic local rollback, exact failed-save retry, lost server acknowledgement, duplicate/concurrent receipt replay and failed local acknowledgement persistence.
- Independent browser-origin downloads, pending/blocked download protection and same-origin tab invalidation.
- Authentication-required and owner-mismatch requests, expiry feedback and sign-out with a held response/blocked deletion.
- Team membership batches and setup edits, Match Start, snapshots and expected-revision conflicts.
- First-tap event time, both selection orders, modal cancellation/locking, durable local Undo and tombstone downloads.
- Clock controls/reload/correction, period advancement, score corrections and completed read-only summary.
- Eligibility filtering, paired substitutions, active/bench cards, queued penalties, offline manual completion/entry, third-blue exclusion and compound Undo.
- Stale powerplay dialog rejection and manual required time when no clock is established.
- English/Portuguese at narrow widths, enlarged text and offline locale switching.

These checks reused a normal development login. Independent origins demonstrate separate IndexedDB/cache state, not independent user/device sessions. Physical devices, a full Chromium/Firefox/WebKit pass and a complete two-account switching exercise remain unverified.

## Branch wrap-up review

The review covers source changes against master, current requirements, transaction/receipt boundaries, event/lifecycle rules and docs consistency. It excludes test files and automated test execution.

One confirmed issue was found in aggregate delivery feedback: Match list/details status ignored pending matchEvent commands. DeliveryStatus now uses the shared command-feature mapping so setup, controls, events and Undo contribute to the same Match status while event-specific labels remain filtered by event ID.

Wrap-up checks passed: repository formatting, lint, TypeScript and production build; explicit README/docs formatting; git diff whitespace validation; and 48 local Markdown links/anchors. No automated tests were read, added, changed or run.

The status bug was reproduced before the fix with a pending event shown as Synced. The updated production build showed saved-local or needs-attention on Match list/details for pending/blocked event work, retained correct event-specific feedback, and kept the Match pending through offline Undo. Successful upload returned the status to Synced. QA records were removed after verification; existing user records were preserved.

No other prototype-blocking issue was identified in the reviewed paths. This is a source review and targeted browser verification, not exhaustive release certification. The known limits below remain deferred.

## Next increments

Select a small scope from the [Backlog](backlog.md) before implementing further work. The anticipated next branch improves recorder UI/UX using the functioning prototype and observer feedback. Keep domain rules shared and preserve offline durability.

Field pointer capture, arbitrary historical corrections, conflict recovery, automated penalty timing and broader release validation each require their own scope/acceptance criteria. Do not treat these as already implemented because the contracts contain optional fields.

## Verification policy

Run relevant formatting, lint, typecheck and production-build checks. `npm run check` currently contains those commands only. Explicitly check docs formatting and local links because docs are excluded from the repository-wide Prettier script.

Service-worker/offline acceptance requires a production build, not development mode. Use a separate matching browser/auth origin. Remove only identified QA fixtures afterward and preserve the user's records.

Do not read/add/change/run automated tests without explicit user authorization. Later targeted tests should cover important pure guards/replay or real transactional failure paths after the behavior is functioning; historical planning text grants no test permission.
