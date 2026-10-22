# Development plan and prototype status

## Shared form presentation and mobile creation actions

Requested after the account-form review. Add visible action headings/subtitles, reduce help to secondary information, remove local input-radius overrides and use the accent theme for enabled account pills. Extend the shared mobile footer-action layout to user, team and player creation without changing their submission or validation logic. Verify source checks and production desktop/mobile behavior; automated tests remain outside scope.

Implemented for review. TypeScript, ESLint, formatting, production build, catalog parity and diff whitespace checks passed. Production browser review covered desktop, 390px phones, 320px with 125% text, and a reduced-height phone viewport. All three creation action bars meet the app footer on short forms; long forms keep actions visible while scrolling. Inputs share the 20px theme radius, enabled account badges use the mint accent, and action dialogs display headings and account-specific subtitles. Creation help opened by click, closed with Escape and restored focus. Validation focus stays above the sticky action bar after adding mobile control scroll spacing. Disposable accounts, local browser data and private session files were removed. Automated tests were not read, added, changed or run.

## Account management UI refinement

Requested after reviewing the first implementation. Move creation to its own protected page, reuse confirmed Mantine password fields for creation/replacement, tighten new-password validation, replace persistent instructional paragraphs with accessible help, and present mobile accounts as rows. Keep existing account actions in dialogs and add user details/metrics to the backlog. Verify source checks and production browser behavior without automated tests.

Implemented for review. TypeScript, ESLint, production build and catalog parity passed. Production browser interactions verified invalid username feedback, new-password length validation, matching confirmation in both forms, creation redirect, password replacement/session revocation and server rejection of short new passwords. A disposable legacy eight-character credential still signed in, and normal-user navigation to the creation page redirected to the application menu. Visual screenshots were reviewed at desktop and 390px phone widths; a 320px/125% text view had no horizontal overflow. Portuguese help popovers opened by click, closed with Escape and restored trigger focus. Existing home navigation reloaded offline under the production worker, with no cached admin directory/creation/API responses. Disposable accounts, local browser data and private session files were removed. Automated tests were not read, added, changed or run. No packages or migrations were added.

## Closed-beta user management

Authorized on 2026-10-22. Implement in reviewable increments: account rules and protected server workflows; online-only navigation and paginated account directory; creation, display-name editing, password replacement and disable/enable; permanent deletion of disabled normal accounts with username confirmation. Reuse Better Auth and existing Mantine/shared UI. Protect admin accounts and retain the existing offline hockey policy. No packages or automated tests are required.

Acceptance requires non-test source checks and production-browser review of normal-user denial, protected admin targets, account lifecycle actions, session revocation, deletion of owned history, cancellation/retry, both languages and narrow-screen access. Keep the route and API outside offline caching. Implementation and acceptance evidence are recorded below; the UI is ready for user review.

Implemented for review on 2026-10-22. TypeScript, ESLint and the production build passed. Production browser interactions verified creation, duplicate usernames, display-name editing, password replacement and session revocation, disable/enable, cancellation, retained drafts after a failed request, protected admin targets, normal-user route/API denial, account mismatch, native admin endpoint denial and no-store directory responses. Server pagination returned 20 then two disposable accounts. Permanent deletion rejected enabled accounts, required exact username confirmation and removed the complete disposable SQL dataset, including restrictive MatchPlayer/event references, credentials, sessions and receipts.

English/Portuguese controls, 1366px desktop geometry and 320px layouts with 125% text size were checked through accessibility snapshots, interaction and element bounds. Screenshot capture timed out, so a screenshot-based visual pass remains unavailable. Production service-worker inspection found no cached admin documents/API responses; the existing home menu reloaded offline. Disposable accounts, hockey records, browser-local data and temporary session files were removed. No automated tests were read, added, changed or run. No packages or schema migrations were added. Physical-device/browser-family review remains outstanding.

## UI revamp branch review on 2026-10-22

Reviewed `feat/full-ui-ux-revamp` against `master` at `1846a82`, through branch HEAD `d843b2b`, including the existing uncommitted documentation updates. The committed range contains 37 commits and changes 321 files. Source review focused on the shared shell/forms, match preparation, recorder capture and busy states, powerplay replay, SQL mapping and protocol compatibility, and completed-match analysis. No blocking code issue was identified in these reviewed paths; no application code changed during this review.

Fresh checks passed: `npm run check`, covering repository formatting, lint, TypeScript and the production build. Separate checks passed for the updated documentation formatting, 48 local documentation links/anchors, key and interpolation-argument parity across 651 English/Portuguese messages, and diff whitespace. Automated tests were not read, added, changed or run.

The production-browser and offline results in the increment notes are earlier recorded evidence. This documentation review did not repeat browser workflows, apply migrations or exercise authenticated uploads. In particular, the new event-protocol server acceptance still needs an authenticated end-to-end check. Physical-device ergonomics, browser-family acceptance, long-history profiling and the final whole-application review remain pending. This branch review does not mark the revamp complete.

## Current UI revamp

The complete page-by-page UI revamp is tracked in [Design revamp](design-revamp.md), including agreed design decisions, progress, next steps and acceptance criteria. Increment 1 covers the centered sign-in page and shared layout/header. Increment 2 covers the menu, shared navigation cards, compact header actions, footer status and sign-out confirmation. Increment 3 covers Players and shared responsive navigation, headings, back navigation, search and rows. Increment 4 begins with the approved player profile and read-only team memberships. The player view is accepted. The New player form is accepted and establishes the unboxed shared form layout for later page increments. Shared header density, sticky positioning and icon animations are complete. The Teams list is accepted, with search placeholder ellipsis refined. The user requested Team view next, ahead of New team. The Team profile/roster presentation is accepted. Membership editing uses the accepted responsive dialog and segmented role control. Two-step player assignment is accepted as the first version, excluding existing members and reusing the shared search and membership fields. Edit team now uses the responsive dialog and shared TeamFields, implemented for review. New team is accepted with the shared unboxed form, predefined/custom categories and a year-only season picker. Creation and editing share TeamFields and preserve existing custom values. The Matches list is implemented for review with shared heading/search, compact rows, lifecycle pills and call-up counts; existing queries, sorting and navigation are unchanged. Production laptop, phone and offline reload checks passed. The three-step New match wizard is accepted, with compact call-up selection, Match-only player editing on Review and a team-change confirmation. Existing local creation rules and atomic persistence remain unchanged. The setup/live Match overview and separate Edit details dialog/Edit call-up page are implemented for review. They reuse creation controls and the existing revision-aware update mutation; completed matches now use the separate read-only analysis. The duration/Prepare match increment is implemented for review: creation and Edit details save two equal halves with editable category defaults; Prepare match selects the starting five using the saved format. Legacy records remain readable. The balanced live recorder is implemented for review with modular scoreboard, player/bench selection, action grid, responsive event dialogs and recent/full timeline. Current-period attack direction uses the existing revision-checked queue. The approved completed-summary redesign is implemented for user review, with period-filtered team/player statistics, linked event map/timeline and conservative recorded playing time. Non-test source checks, production phone/laptop review and an offline reload passed; evidence is in Design revamp. The user chose compact Review rows with a responsive dialog for per-match jersey/role edits. Edit/Delete functionality is deferred to the next branch. Later increments require their own scope review. The revamp branch is not ready until all increments and the final application review pass.

The prototype status and verification evidence below describe the behavior baseline before this visual revamp.

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

## Prototype wrap-up review before the UI revamp

The review covers source changes against master, current requirements, transaction/receipt boundaries, event/lifecycle rules and docs consistency. It excludes test files and automated test execution.

One confirmed issue was found in aggregate delivery feedback: Match list/details status ignored pending matchEvent commands. DeliveryStatus now uses the shared command-feature mapping so setup, controls, events and Undo contribute to the same Match status while event-specific labels remain filtered by event ID.

Wrap-up checks passed: repository formatting, lint, TypeScript and production build; explicit README/docs formatting; git diff whitespace validation; and 48 local Markdown links/anchors. No automated tests were read, added, changed or run.

The status bug was reproduced before the fix with a pending event shown as Synced. The updated production build showed saved-local or needs-attention on Match list/details for pending/blocked event work, retained correct event-specific feedback, and kept the Match pending through offline Undo. Successful upload returned the status to Synced. QA records were removed after verification; existing user records were preserved.

No other prototype-blocking issue was identified in the reviewed paths. This is a source review and targeted browser verification, not exhaustive release certification. The known limits below remain deferred.

## Next increments

Follow the agreed sequence in [Design revamp](design-revamp.md) for current UI work. Other product work remains in the [Backlog](backlog.md). Keep domain rules shared and preserve offline durability.

The approved completed-summary increment includes saved-event rink overlays and match-level statistics. Cross-match analytics, arbitrary historical corrections, conflict recovery, individual temporary suspension rules and broader release validation each require their own scope/acceptance criteria. Do not treat these as already implemented because the contracts contain optional fields.

## Verification policy

Run relevant formatting, lint, typecheck and production-build checks. `npm run check` currently contains those commands only. Explicitly check docs formatting and local links because docs are excluded from the repository-wide Prettier script.

Service-worker/offline acceptance requires a production build, not development mode. Use a separate matching browser/auth origin. Remove only identified QA fixtures afterward and preserve the user's records.

Do not read/add/change/run automated tests without explicit user authorization. Later targeted tests should cover important pure guards/replay or real transactional failure paths after the behavior is functioning; historical planning text grants no test permission.

## Clock-linked powerplay increment

Implemented for review: saved two-minute blue/four-minute red team penalties, sequential playing-time expiry across halves, compact card indicators beside the main clock with total queued time, red lineup status, remaining-time correction including explicit completion at zero, and a deferred automatic Player in picker. The expiry projection creates no background events and leaves latest-event Undo intact. Old cards remain manual until corrected. Version-5 event commands and SQL migration 0013 preserve offline/server parity. TypeScript, scoped lint, formatting, catalog parity and production build passed. Production browser checks covered timers, correction/Retry, queued expiry, halftime, preserved drafts, Player in/Undo, 320px enlarged-text layouts and offline reload. The final two-blue indicator displayed 04:00. SQL migration applied locally; authenticated event upload was not exercised. Automated tests were untouched.

## Rink-first entry increment

Implemented for review on 2026-10-21: shared theme-aware inline rink SVG with marker inputs, desktop rink selection, phone picker with touch magnification, keyboard positioning, direction-aware normalized coordinates, derived recovery/loss half and integration with the existing event draft/save/Undo workflow. Repositioning and failed-save Retry retain captured identity/time. Later refinements removed event-dialog Back navigation and added completed-match saved-event overlays. Cross-match spatial analytics remain deferred.

Scoped formatting, source ESLint, TypeScript, catalog parity, documentation links and the production build passed. Isolated production browser checks covered both attack directions, unknown-direction setup, keyboard cancellation, first-contact capture with the running clock, touch dragging/magnification, outside release, pointer and multi-touch cancellation, Back/repositioning, automatic and halfway half selection, exact Retry after a forced local-storage failure, Undo, ordinary entry without coordinates, and 320px Portuguese enlarged-text layout without horizontal overflow. Service-worker-controlled offline reload, recording and durable reload passed. QA used disposable isolated local records and left the user's data untouched. No authenticated event upload was exercised; the existing transport/storage schema is unchanged. Automated tests were not read, added, modified or run. Physical-phone ergonomics and a full browser-family pass remain pending; this increment is not marked accepted.

## Desktop recorder viewport refinement

Implemented for review: controls/lineup remain on the left, with the capped rink above the timeline on the right. Desktop actions use side-by-side icons/labels and slightly tighter player/scoreboard spacing. The timeline heading stays outside its scrollable list, and desktop rink instructions use a short hint plus accessible help. Compact-screen layout and recording rules are unchanged.

Production browser geometry with ten called-up players and 30 events confirmed full-page fit at 1366×768 and 1440×900 in English/Portuguese, a 480px rink at normal text size, and an independently scrollable list with a stationary heading. Larger text and shorter windows retain accessible page scrolling; the 390px phone retained its existing placement and touch flow. Formatting, source ESLint, TypeScript, catalog parity and production build passed. Service-worker-controlled offline reload retained the desktop layout, help content and rink-entry dialog. QA used disposable isolated local records. Automated tests were not read, added, changed or run.

## Rink orientation and selection refinement

Implemented for review on 2026-10-22: Attack/Defence labels inside the rink, a restrained attacking-half tint that fades around halfway, and a fixed-screen-size selection marker with an accent centre, contrasting ring and dark halo. The desktop event preview grows from 96px to 136px at default text size. The accepted point stays on the background rink until saving or cancellation. Semantic half announcements replace visible percentages; recording coordinates, capture rules and mobile gesture handlers are unchanged.

Source ESLint, TypeScript, catalog parity, scoped formatting and production build passed. Isolated production-browser review covered both directions, matching preview/background positions, persisted team-relative coordinates after a shot, clearing on save/cancel, keyboard half feedback/cancellation, and service-worker-controlled offline reload and draft opening. The desktop retained full-page fit at 1366×768. Portuguese touch emulation retained magnification and a readable compact marker, with no horizontal overflow at 320px and 125% text size. Label contrast exceeded 8:1; marker ring/halo contrast exceeded 15:1. No runtime page errors occurred. Automated tests were not read, changed or run. Touch emulation also reproduced release passing through to an action button; retain this for the separately requested mobile-flow pass. Physical-device and browser-family acceptance remain pending.

## Rink desktop and mobile polish

Implemented for review on 2026-10-22: defensive-half tint, larger in-field labels, full-width event previews, no separate rink heading or team goal labels, and help beside the desktop click instruction. Compact entry uses a glass-style control with the shared rink SVG. Event dialogs retain Cancel without Back navigation. Touch magnification is 1.5× with a centre marker. A short compatibility-click guard fixes release passing through to the action choices; a subsequent pointer/keyboard interaction clears the guard immediately. General font sizing remains deferred.

Source ESLint, TypeScript, catalog parity, scoped source/docs formatting and production build passed. Disposable production-browser records confirmed 1366×768 and 1440×900 desktop fit with 30 or more events, the approximately 400px desktop modal rink, reversed orientation in English, and preserved period/time/team-relative coordinates after saving a shot. Portuguese mobile review covered the glass entry control, readable half labels, 1.5× lens, three touch releases that retained action choices, Change position preserving the point, no Back control, and cancellation. At 320px and 125% text size, the entry and picker had no horizontal overflow. Help focuses its dialog, closes with Escape and returns trigger focus. Service-worker-controlled desktop and mobile offline reloads retained the updated flow. No runtime page errors occurred. Automated tests were not read, added, changed or run. Physical-phone and browser-family acceptance remain pending.

## Recorder spacing and rink guidance

Implemented for review on 2026-10-22: balanced score/separator and clock/action spacing, consistent section gaps, a larger desktop rink top inset, swapped half-label colors and slightly smaller/lower labels. The horizontal mobile picker uses short touch guidance without keyboard references. Its 1.5× lens moves above or below the finger without reserving a large empty area, and omits labels inside the lens. Shared rink/arrow previews guide direction selection in the normal dialog and unknown-direction options. Existing direction save behavior and recording coordinates are unchanged. Action/player button appearance and general font sizing remain deferred.

Source ESLint, TypeScript and production build passed. Production-browser review with ten called-up players, 31 events and an active blue-card powerplay confirmed full-page fit at 1366×768 and 1440×900 after a desktop spacing adjustment. Labels use the intended colors, baseline and sizes. A 390px touch view showed only touch instructions; top/bottom selections placed the lens below/above the finger, cancellation cleared it, and release retained action choices. Direction preview switching and Save updated the recorder; Portuguese mobile direction and unknown-direction options fit at 320px with 125% text size without horizontal overflow. Service-worker-controlled desktop and mobile offline reloads retained the updated views and saved direction. No runtime page errors occurred. QA used disposable isolated local records. Automated tests were not read, added, changed or run. Physical-phone/browser-family acceptance remains pending.
