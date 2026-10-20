# Product requirements

Benchline Stats is a responsive rink-hockey application for an observer managing players, teams and live matches on a personal device. The prototype prioritizes reliable local capture and synchronization. UI refinement and advanced analysis follow separately.

## Current prototype scope

- Players: create, search, list and view details. Duplicate names are valid.
- Teams: create, edit name/category/season, view details, assign multiple existing players and edit their optional jersey numbers and field-player/goalkeeper roles.
- Matches: choose a team, opponent and call-up; optionally specify date and venue; save incomplete setup; edit before starting.
- Start with exactly four field players and one goalkeeper. Configure periods and optional durations.
- Live tracking: recovery, loss, shot, player-attributed foul, yellow/blue/red card, paired substitution, manual powerplay completion, fifth-player entry, opponent goal and score correction.
- Countdown clock with start/pause, manual adjustment and explicit period/match completion.
- Timeline and durable Undo of the latest eligible locally recorded event. Finished matches open a read-only summary.
- English and European Portuguese throughout, including offline use.

The canonical entity name is Match. Event attribution uses its MatchPlayer snapshot. See [Domain model](domain-model.md) for exact rules and [Recorder UX](recorder-ux.md) for entry behavior.

## Offline and accounts

Require one successful online sign-in to establish the owner of the local dataset. After setup, all current hockey workflows use IndexedDB online and offline. Session expiry pauses synchronization without blocking local use. Guest functionality is deferred.

A match can be created offline using locally available team/player data, including prerequisites created offline. No per-match server preparation or server-issued ID is required. Data never downloaded or created on the device is unavailable there.

Save records and their outbox operations atomically before reporting success. Distinguish saved on this device, waiting, synced and blocked states. A Match's delivery status includes its setup, controls, events and Undo operations. Never silently discard failed uploads or overwrite pending work with downloads.

The fixed `/app/.../view?id=…` routes and Match Start/live routes cache generic pages; the browser selects records from IndexedDB. Unknown IDs show unavailable. Legacy Player/Team dynamic detail documents remain online-compatible.

Explicit sign-out deletes the entire application IndexedDB database, including unsynced records, after successful server sign-out. Generic installed application files remain. Cleanup failure offers retry. This personal-device policy does not encrypt local data or check fresh revocation while offline. See [Offline and sync](offline-sync.md) and [Account authentication](account-auth.md).

## Recording requirements

- Player-first and action-first entry produce the same canonical event through one service.
- Capture current period, wall-clock capture time and any known game time at the first tap. Later choices and retries retain them.
- Keep unfinished drafts only while the modal is visible. Cancel writes nothing; reload discards unfinished selection.
- Every event includes its period. Substitution, fifth-player entry, non-yellow card and powerplay completion require game time. Other events may omit it.
- Optional coordinates contain both normalized x/y values. No field click means no coordinates. Rink interaction is deferred; contracts already support position.
- Hide incompatible actions and players. Recheck the same rules inside local and server transactions.
- Keep four or five players on the field and at most one goalkeeper. Outstanding powerplay limits the team to four. Ordinary substitutions exchange two players atomically.
- Yellow has no lineup/powerplay effect. Blue/red affect team capacity even for bench recipients. The third blue triggers permanent red-card exclusion. Temporary individual suspension restrictions and automatic timers are deferred by agreement.
- Derive score, lineup, card accumulation and powerplay from non-deleted history. Do not keep a second authoritative mutable copy.

## Acceptance baseline

The implementation should support these scenarios in a production build:

1. Create players, a team and a Match offline after initial sign-in. Reload without losing committed data.
2. Assign the same Player to different teams with independent numbers/roles. Match snapshots preserve historical details.
3. Capture an eligible event through either entry order. Missing required details block saving; optional position never blocks it.
4. Capture known time automatically while running or paused. Manual time permits required timed actions without a running clock.
5. Apply an active or bench card without an invalid lineup. Queue further penalties at four, complete them manually and then add a fifth player without an outgoing player.
6. Undo the latest eligible event, including its score, lineup, powerplay and third-blue consequences.
7. Reconnect and upload once despite lost acknowledgements or duplicate delivery. Preserve newer local work through acknowledgements and downloads.
8. Pause sync on expiry or account mismatch; retain local work. Sign-out cleanup must not be reversed by late responses.
9. Switch language without losing draft, clock or pending work. Support narrow screens, enlarged text and keyboard/touch access.
10. End periods explicitly and complete the Match. Reopen it as a read-only summary.

## Deferred scope

A polished recorder layout, field-first rink interaction, arbitrary historical editing/deletion, redo, reopening completed matches, official foul rules, automatic penalty timing, conflict resolution, simultaneous multi-device recording, analytics, backup/export, guest accounts and account-management UI remain in the [Backlog](backlog.md).

The [Development plan](development-plan.md) distinguishes implemented features, verification evidence and outstanding release checks. Deferred goals are not current acceptance claims.
