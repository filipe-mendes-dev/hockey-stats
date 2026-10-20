# Backlog

This file contains deferred work, not instructions to implement it. Current behavior is described in [Product requirements](product-requirements.md), [Domain model](domain-model.md) and [Offline and sync](offline-sync.md).

## Next product work

- Recorder UI/UX refinement: control placement, faster selection, long timelines, touch ergonomics and observer feedback.
- Optional SVG rink interaction and field-first entry. Reuse normalized team-relative x/y and keep position optional. Verify scaling/rotation/letterboxing and ignore outside-rink clicks.
- Player editing and explicit delete/archive behavior across entities, including historical references and sync tombstones.
- Arbitrary historical event editing/deletion, redo, historical placement and starter correction. Preview downstream contradictions without silently rewriting events.
- Reopening completed Matches and correcting period/lifecycle transitions.
- Official foul thresholds/resets, competition presets and regulation edge cases.
- Goalkeeper-specific events and possession metrics; assists and opponent Player tracking.
- Game-clock-linked powerplay timers, individual temporary suspension expiry and automatic return prompts. Manual team penalty completion and fifth-player entry already exist.
- Complete penalty duration/accumulation rules, automatic yellow consequences and match abandonment when a valid lineup cannot be maintained.
- Analytics, heatmaps, zones, playing-time reports and season dashboards.

## Synchronization and release hardening

- Actionable conflict inspection/resolution for blocked revision chains. Preserve local intent and require explicit resolution rather than last-write-wins.
- Recorder-tab exclusivity or clear multi-writer safeguards. Web Locks currently serialize sync, not all recorder activity.
- Multi-device simultaneous recording and automatic merge rules, if the product later requires them.
- Incremental downloads/cursors, retention limits and larger-history performance. Current downloads are complete collections and never infer deletion from absence.
- Background Sync, server push/WebSockets and separately deployed API infrastructure only when needed.
- Monotonic/wall-clock reconciliation, drift diagnostics and clock handoff.
- Physical-device installation/offline checks, a full browser-family pass, independent-user account switching and observer exercises.
- Export/import, manual and automated backup, recovery tooling and restore exercises.
- Retire legacy dynamic Player/Team URLs if no longer needed; current fixed query views already support offline delivery.
- Dependency advisory triage before a release. Keep upgrades separate from this prototype cleanup; do not force unrelated dependency rewrites.

## Accounts and additional product scope

- Signed-in password change, administrator-assisted recovery and any initial-password-change requirement.
- Permission-gated admin navigation and user-management UI. Terminal helpers currently create users.
- Guest use without initial online sign-in and explicit adoption rules.
- Offline-only data clearing and delayed server-session revocation, if required. Current sign-out reports network failure and retains local data when server sign-out fails.
- Shared-device unlock/encryption, device management and a different local retention policy if personal-device assumptions change.
- Shared accounts, organizations, invitations and additional roles.
- Billing/subscriptions, native applications, video synchronization and automated event detection.

## Decisions for later scopes

- Confirm shot/statistical edge cases before adding aggregate analytics. Current outcomes are exclusive goal, non-goal on-target, off-target and blocked.
- Confirm competition presets and full penalty rules before automating them. Current observer-driven team powerplay intentionally omits temporary personal restrictions.
- Discuss added packages, generic repositories or a sports rules engine only when an actual second use case requires them. Keep one app, shared outbox and direct feature functions for this prototype.
