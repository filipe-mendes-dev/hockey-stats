# Backlog

This file contains deferred work, not instructions to implement it. Current behavior is described in [Product requirements](product-requirements.md), [Domain model](domain-model.md) and [Offline and sync](offline-sync.md).

## Player lifecycle follow-ups

- Restore and permanent purging of logically deleted Players/Teams, including delivery-receipt retention. Current deletion work preserves historical identities and uses synchronization tombstones.

## Next product work

- Recorder UI/UX refinement: control placement, faster selection, long timelines, touch ergonomics and observer feedback.
- Cross-match spatial filters, heatmaps and analytics. The approved completed-match summary includes saved-event overlays and linked marker/timeline selection using the shared rink renderer and stored normalized team-relative x/y; missing coordinates remain unknown.
- Recovery and permanent purging policies beyond the approved Player/Team logical deletion, Match deletion and membership removal workflows.
- Arbitrary historical event editing/deletion, redo, historical placement and starter correction. Preview downstream contradictions without silently rewriting events.
- Reopening completed Matches and correcting period/lifecycle transitions.
- Cup-specific extra periods/extra time and the corresponding preparation and lifecycle UI. The redesigned preparation flow assumes two regulation halves; cup formats remain deferred.
- Live duration correction with explicit clock/event-history rules. Match duration is configured during creation and editable before starting; changing it during recording is lower priority.
- Official foul thresholds/resets, competition presets and regulation edge cases.
- Additional goalkeeper metrics beyond the recorded save/conceded-goal summary; possession metrics, assists and opponent Player tracking. General opponent-shot capture is outside the agreed recorder scope.
- Individual temporary suspension expiry. Team powerplay timers, remaining-time correction and automatic fifth-player prompts are implemented in the current increment.
- Complete penalty duration/accumulation rules, automatic yellow consequences and match abandonment when a valid lineup cannot be maintained.
- Cross-match analytics, heatmaps, zones, playing-time reports and season dashboards. Per-match recorded playing time belongs to the approved completed summary.

## Synchronization and release hardening

- Profile the completed-summary timeline in a production build with realistic long matches on target phones. Descriptions, marker data and breakdowns are cached, and a bounded timeline prevents a full-history expansion from lengthening the page. Consider `@tanstack/react-virtual` only if mounting or scrolling large histories remains a measured bottleneck. Virtualization reduces mounted rows; the bounded container controls page length. Preserve keyboard focus, touch details and scrolling to the row selected on the rink.
- Revisit further match-summary visual refinements after feedback from other users. The current pre-deployment pass covers responsiveness, stable rows, compact result presentation and consistent section accents; additional cosmetic work is not a deployment prerequisite.

- Actionable conflict inspection/resolution for blocked revision chains. Preserve local intent and require explicit resolution rather than last-write-wins.
- Recorder-tab exclusivity or clear multi-writer safeguards. Web Locks currently serialize sync, not all recorder activity.
- Multi-device simultaneous recording and automatic merge rules, if the product later requires them.
- Incremental downloads/cursors, retention limits and larger-history performance. Current downloads are complete collections and never infer deletion from absence.
- Background Sync, server push/WebSockets and separately deployed API infrastructure only when needed.
- Monotonic/wall-clock reconciliation, drift diagnostics and clock handoff.
- Physical-device installation/offline checks, a full browser-family pass, independent-user account switching and observer exercises.
- Shareable read-only match-statistics links. Discuss access, revocation and live-versus-snapshot behavior later. A well-formatted PDF is a possible export format, not yet agreed. Keep sharing/export outside the current recorder branch.
- General export/import, manual and automated backup, recovery tooling and restore exercises.
- Retire legacy dynamic Player/Team URLs if no longer needed; current fixed query views already support offline delivery.
- Dependency advisory triage before a release. Keep upgrades separate from this prototype cleanup; do not force unrelated dependency rewrites.

## One-off historical import

Convert only `jogo-2026-10-21.json` after a dry-run review, using the supplied PDF/screenshot as supporting evidence. General import tooling remains deferred. Confirm source-player mappings, team/starters and coordinate bounds before normalization; Z1/Z2 identify halves but do not establish pixel bounds.

Resolve the three unattributed fouls, Santiago's blocked shot and saved penalty sharing a timestamp, incomplete blue-card lineup consequences, a backwards second-half event time and missing wall-clock/period-end times. Never invent attribution or played time, relax foul validation or silently reorder source history. Confirm any exclusions explicitly.

The later converter needs source-ID mapping, duplicate-import protection, account-scoped atomic writes and normal synchronization. Sharing/export decisions remain separate.

## Accounts and additional product scope

- Signed-in password change and any initial-password-change requirement. Administrator-assisted password replacement belongs to the closed-beta Users page.
- A dedicated user detail page with account information, owned-data counts and activity/synchronization metrics. Keep this deferred while the account directory is sufficient.
- Admin-role management, invitations and broader administration. The closed-beta Users page manages normal accounts only and protects admin accounts.
- Guest use without initial online sign-in and explicit adoption rules.
- Offline-only data clearing and delayed server-session revocation, if required. Current sign-out reports network failure and retains local data when server sign-out fails.
- Shared-device unlock/encryption, device management and a different local retention policy if personal-device assumptions change.
- Shared accounts, organizations, invitations and additional roles.
- Billing/subscriptions, native applications, video synchronization and automated event detection.

## Decisions for later scopes

- Confirm shot/statistical edge cases before adding aggregate analytics. Current outcomes are exclusive goal, non-goal on-target, off-target and blocked.
- Confirm competition presets and full penalty rules before automating them. Current team powerplay intentionally omits temporary personal restrictions and goal-driven expiry.
- Discuss added packages, generic repositories or a sports rules engine only when an actual second use case requires them. Keep one app, shared outbox and direct feature functions for this prototype.
