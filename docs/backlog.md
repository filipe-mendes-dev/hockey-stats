# Backlog

Updated 2026-11-02. The current goal is to finish the beta presentation for LinkedIn, the CV and portfolio, with focused improvements to frequently used screens. The user reports that the app is already partly live.

The previously proposed P0 work is deferred beyond this launch, with backups first in the next reliability work. These issues remain open; deferral does not mark them fixed or verified. [Release readiness](release-readiness.md) records the revised launch scope. This backlog is a planning list, not authorization to implement every item.

Current behavior belongs in [Product requirements](product-requirements.md), [Domain model](domain-model.md), [Recorder UX](recorder-ux.md) and [Offline and sync](offline-sync.md). Sources include the original "Organize app feedback by urgency" chat and the [Persistence review](persistence-review.md).

## Near-term launch focus

| Order | Improvement                   | Scope and status                                                                                                                                                                                                                                                                              |
| ----- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Attack direction at halftime  | Automatically switch the recorder's direction for the next half, retaining manual override. Respect explicitly configured next-half directions. Keep completed analysis normalized to attack right and never rotate historical coordinates as a side effect.                                  |
| 2     | Starting lineup for each half | Let the observer confirm or choose who starts the next half. Agree how changes enter lineup history and playing-time calculations, preserving saved events and normal substitution behavior.                                                                                                  |
| 3     | Match-summary UI polish       | Implemented the agreed root redirect, wider completed summary, natural rink height, scrollbar styling, table spacing, taller timeline lanes and concise sharing copy. Review the current app and capture marketing screenshots; statistics calculations and historical records are unchanged. |

Finish the project-facing README, capture current marketing screenshots and prepare the beta version/release presentation alongside those increments. A LinkedIn post and CV/portfolio entry are the immediate presentation goals; no posting or editing of those external artifacts is implied by this list.

## First follow-ups after launch

Items are ordered for the next reliability work. Former P0 findings are tracked here rather than used as blockers for the current launch.

1. **Backups and restore, highest deferred priority.** Establish scheduled off-server PostgreSQL backups, retention and failure reporting. Rehearse restoration using disposable infrastructure and document the recovery procedure. Backups cannot recover browser-only unsynced work. Include device reconciliation after server rollback; the current revision merge can leave an acknowledged device ahead of the restored server without showing a pending operation. See persistence finding F4.
2. **Historical Match-download failure and production repair verification.** Confirm the actual production status before making another repair. The first-half-left/second-half-right coordinate correction advanced the Match to revision 657, rotated 80 first-half positions and corrected 58 recovery/loss half labels. Advancing updatedAt also violated completedAt === updatedAt and caused a Match-download 503. A guarded metadata-only correction to revision 658 was supplied and validated locally; successful production Retry remains unconfirmed. Preserve original completion time, repaired positions, identities, counts and lineup history. See F3.
3. **Membership-pair download collision.** Reproduce F1, where two devices create different membership IDs for the same Team/Player pair. Preserve unresolved local commands and field choices while allowing unrelated downloads to continue. Skipping a row alone is not conflict resolution.
4. **Actionable synchronization diagnostics.** Identify failed stage/endpoint, safe error code, HTTP status and a correlation ID. Report validation/storage failures without credentials or complete recordings. Verify repairs through stored-row mapping and the complete download schema.
5. **Update and compatibility acceptance.** Rehearse an older cached client with pending work against the newer API. Verify close/reopen activation on real devices without forcing an active recorder to reload, clearing IndexedDB or discarding commands.
6. **Real-device and deployed-flow verification.** Check native/manual installation, offline reload, safe areas, portrait/landscape, recorder ergonomics, other browser families and account switching. Exercise sign-in, recording, reconnect/upload, independent download, Undo, completion and public share/revoke together on the deployed client/server.
7. **Deployment evidence and recovery.** Record the actual image digest, migrations, HTTPS/PWA behavior and update recovery. Older docs describe earlier local evidence and pending rollout; reconcile them with the user's report that the app is already partly live. Do not infer current production status from those historical notes.
8. **Dependency/toolchain follow-up.** Reassess the moderate tooling findings, unsupported ESLint 9 and optional peer warning recorded in [Dependency advisories](security-advisories.md). The 2026-11-01 work aligned Next.js/eslint-config-next at 16.4.3 and patched Serwist's nested Zod. Prefer supported upstream upgrades; avoid forced incompatible dependency rewrites.

## Synchronization, storage and recovery

- **Reduce redundant requests.** One visible idle client currently downloads five complete collections every 60 seconds; paired focus/visibility events can queue duplicate cycles. Coalesce wake-up triggers and coordinate polling across tabs while retaining immediate manual retry, reconnect and new-write delivery. Web Locks serialize cycles without deduplicating them.
- **Separate uploads from background downloads.** Saving an event should not trigger a complete account-history download. Define freshness/backoff, avoid rewriting identical records and invalidate only changed queries. Retain owner checks, revisions and pending/blocked protection.
- **Changed-only retrieval.** Design a server-issued cursor with explicit deletion markers, optionally batching collection requests. Preserve consistent Match snapshots/events and interrupted recovery. Client updatedAt is not a reliable cursor.
- **Selective offline retention.** Keep Players, Teams, memberships, draft/live Matches and all pending/blocked work available locally. Debate completed-summary pagination, on-demand histories and a small cache or Keep offline option. Eviction must neither issue server deletions nor trigger immediate redownload; change page reads and sync retention together.
- **Conflict inspection and resolution.** Preserve local intent, inspect remote state separately and require explicit choices for blocked revision chains or rejected local deletions. Retry alone does not resolve conflicts. Do not silently rebase, reset expected revisions or use last-write-wins. See F2.
- **Unreadable outbox recovery.** One malformed or unsupported stored command currently prevents whole-queue parsing. Design inspection/quarantine and preservation/export without clearing unrelated work. See F5.
- **Isolate failures.** One invalid recording can prevent full Match downloads; one failed upload can stop unrelated downloads. Define safe partial recovery and pull opportunities while retaining per-Match atomicity, owner checks and dependency order. Do not silently omit failed records or report incomplete results as fully synchronized. See F3/F6.
- **Recorder concurrency.** Consider one-recorder safeguards or clear multi-writer feedback before supporting simultaneous tabs/devices. Sync Web Locks do not make recorder activity exclusive. Automatic multi-device merge rules need a separate product decision.
- **Clock drift and handoff.** Diagnose wall-clock skew and reconcile persisted anchors across reloads/devices without changing historical occurrence times or treating upload time as event time. See F8.
- **Additional infrastructure only when justified.** Background Sync, push/WebSockets or a separately deployed API need a concrete requirement.

## Recorder and everyday usability

- **Late-event workflow.** Add an explicit missing-event/late-substitution flow with actual period and game time, preserving the main clock and validating the complete resulting history. Existing chronological validation does not provide arbitrary historical editing.
- **Historical editing.** Debate saved event time/player corrections, individual deletion, redo, starter corrections and reopening completed Matches. Preview downstream contradictions; never silently rewrite history.
- **Live-game banner.** Agree a location and action for returning to an active Match from other pages.
- **Installation prompt.** Investigate the original reported prompt issue after native/manual installation is checked. Decide whether a custom prompt is useful and when to show it.
- **Further recorder refinement.** Review grouping, control placement, long timelines and observer feedback after the current primary-action hierarchy. Use actual event counts as preliminary evidence, not as tap counts or time spent looking away.
- **Colours and icons.** Complete semantic-colour adoption in the live timeline and review player/goalkeeper pill colours and remaining icon variants. Reuse the summary conventions and preserve separate meanings for event identity, selection, delivery status and validation.
- **Shot/loss classification.** Debate when a poor or blocked shot also warrants a separate loss. Never infer possession loss from shot outcome alone or reclassify historical events automatically.
- **Private JSON analysis export.** Provide an authenticated recording export for chronology diagnosis and action-frequency analysis. Keep raw private data separate from public sharing and from general backup/import tooling.
- **Summary performance.** Profile realistic long Matches on target phones. Consider virtualization only for measured mounting/scrolling problems, retaining keyboard focus, touch details and rink-to-event scrolling.

## Competition and editable Match metadata, proposals

These are optional follow-ups, not required for the current launch and not implemented requirements.

- Choose a competition for each game. Debate whether the first version needs only an optional label/selector or a managed competition entity. Competition-specific rules are separate.
- Allow later editing of competition, venue and date, potentially after a Match starts or completes. Agree exactly which lifecycle states and fields permit editing; current setup editing must not be mistaken for this feature.
- Define whether date represents scheduled date, played date or another explicit value, including timezone behavior.
- Keep metadata edits separate from event times, clock, lineup, score and calculated statistics. Agree how synchronized changes appear on existing public share links and how conflicts are handled.
- Keep Team category and season distinct from competition. Do not add extra periods or competition presets implicitly.

## Hockey rules and statistics

- Coach/delegate cards, with explicit recipients and agreed team consequences.
- Individual temporary suspension expiry, full penalty duration/accumulation rules, automatic yellow consequences, goal-driven penalty expiry and abandonment when a valid lineup cannot continue. Current timed team powerplay is a smaller scope.
- Official foul thresholds/resets and competition regulation edge cases.
- Cup-specific extra periods and extra time; current preparation assumes two regulation halves.
- Live duration correction with agreed effects on clock/events. Pre-start duration editing already exists.
- Additional goalkeeper metrics, possession, assists and opponent Player/shot tracking.
- Cross-match spatial filters, heatmaps, zones, playing-time/season reports and dashboards. Completed per-match maps and recorded playing time already exist.
- PDF export and other presentation formats, separate from public read-only sharing.

## Accounts, security and lifecycle

- Request-byte/text bounds, owner/IP throttling and account resource budgets. Verify deployed proxy controls before claiming they exist; Content-Length alone does not bound chunked input. See F7.
- Self-service password change and initial-password-change policy. Administrator-assisted password replacement already exists and self-service remains lower priority.
- Player accounts, account details/activity pages, invitations, admin-role management, shared accounts and organizations. Agree access and ownership for each.
- Guest use without initial online sign-in and explicit adoption of guest data.
- Offline-only clearing or delayed server-session revocation if needed. Current failed online sign-out retains local data.
- Shared-device unlock/encryption and device management if personal-device assumptions change.
- Restore/permanent purging of removed Players/Teams and delivery-receipt retention. Current removal preserves historical identities and uses synchronization tombstones.
- General user-facing export/import and recovery tools, separate from the operational backup priority above.

## Historical import and later expansion

- Convert only jogo-2026-10-21.json after a dry-run review, using its supplied PDF/screenshot as supporting evidence. Confirm source-player mappings, Team/starters and coordinate bounds; Z1/Z2 identify halves, not pixel dimensions.
- Resolve the three unattributed fouls, Santiago's blocked shot and saved penalty sharing a timestamp, incomplete blue-card lineup consequences, a backwards second-half event time and missing wall-clock/period-end times. Do not invent attribution/played time, relax validation or silently reorder history. Confirm exclusions explicitly.
- A converter needs source-ID mapping, duplicate-import protection, owner-scoped atomic writes and normal synchronization. General import remains a separate feature.
- Retire legacy dynamic Player/Team routes only if no longer needed; fixed query views already support offline delivery.
- Billing, native applications, video synchronization and automated event detection remain later product scopes.
- Add packages, generic repositories or a rules engine only when a concrete need justifies them. Keep one app, one shared outbox and direct feature functions.

## Already implemented from the original feedback

Chronological replay/order, playing-time derivation, normalized completed-match rink coordinates, revocable public sharing, the primary recorder action hierarchy, magnifier placement, safe-area CSS, Bad pass/Tackle labels, Poor reception and the horizontal logo are implemented. Keep their remaining verification work above; do not reopen them as entirely missing features. Dedicated missing-event UI, per-half lineup confirmation and automatic halftime direction are distinct follow-ups.
