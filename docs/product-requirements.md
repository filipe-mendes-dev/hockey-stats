# Product requirements

Benchline Stats is a responsive rink-hockey application for an observer managing players, teams and live matches on a personal device. The prototype prioritizes reliable local capture and synchronization. A complete dark, responsive UI revamp is now proceeding page by page through [Design revamp](design-revamp.md); advanced analysis remains deferred.

## Current prototype scope

- Players: create, search, list and view details, including locally available team memberships, jersey numbers and roles. Duplicate names are valid.
- Teams: create, edit name/category/season, view details, assign multiple existing players and edit their optional jersey numbers and field-player/goalkeeper roles.
- Team forms offer Senior, U-19, U-17, U-15, U-13 and Veteran as category presets, while accepting custom category text. A year picker stores seasons as 2026/27; existing nonstandard season text stays editable. Both fields remain optional.
- Matches: choose a team, opponent and call-up; optionally specify date and venue; configure two equal halves during creation; save an incomplete call-up; edit details/call-up before starting.
- Start with exactly four field players and one goalkeeper, using the saved duration. Category defaults per half are 25 minutes for Senior/U-19/Veteran, 20 for U-17/U-15 and 18 for U-13. Duration remains editable during creation and pre-start detail editing; missing/custom categories require a choice. Existing records remain readable. The recorder can set attack direction for the current live period; cup-specific extra periods remain deferred.
- Live tracking: recovery, loss, shot, player-attributed foul, yellow/blue/red card, paired substitution, clock-linked powerplay expiry/correction, fifth-player entry, opponent goal and score correction.
- Countdown clock with start/pause, manual adjustment and explicit period/match completion.
- Timeline and durable Undo of the latest eligible locally recorded event. Finished matches open a read-only summary with the final result, period-filtered team statistics, linked event map/timeline and individual player statistics including recorded playing time, shot outcomes, recoveries/losses, fouls and cards.
- English and European Portuguese throughout, including offline use.

The canonical entity name is Match. Event attribution uses its MatchPlayer snapshot. See [Domain model](domain-model.md) for exact rules and [Recorder UX](recorder-ux.md) for entry behavior.

## Offline and accounts

Closed-beta accounts are created by administrators without public signup or email workflows. The online-only Users page supports account creation, display-name editing, password replacement, disable/enable and explicit permanent deletion of disabled normal users. Creation uses a dedicated page. New/replacement passwords require 12–128 characters, cannot be blank-only and require matching confirmation. Admin accounts are protected; usernames and roles cannot be edited. Disabling retains server hockey data. Permanent deletion removes the account and its server data, while remote local data remains outside the administrator's control.

Require one successful online sign-in to establish the owner of the local dataset. After setup, all current hockey workflows use IndexedDB online and offline. Session expiry pauses synchronization without blocking local use. Guest functionality is deferred.

A match can be created offline using locally available team/player data, including prerequisites created offline. No per-match server preparation or server-issued ID is required. Data never downloaded or created on the device is unavailable there.

Save records and their outbox operations atomically before reporting success. Distinguish saved on this device, waiting, synced and blocked states. A Match's delivery status includes its setup, controls, events and Undo operations. Never silently discard failed uploads or overwrite pending work with downloads.

The fixed `/app/.../view?id=…` routes and Match Start/live routes cache generic pages; the browser selects records from IndexedDB. Unknown IDs show unavailable. Legacy Player/Team dynamic detail documents remain online-compatible.

Explicit sign-out requires confirmation and a warning for unsynced work, then deletes the entire application IndexedDB database, including unsynced records, after successful server sign-out. Generic installed application files remain. Cleanup failure offers retry. This personal-device policy does not encrypt local data or check fresh revocation while offline. See [Offline and sync](offline-sync.md) and [Account authentication](account-auth.md).

## Recording requirements

- Player-first, action-first and optional rink-first entry produce the same canonical event through one service.
- Capture current period, wall-clock capture time and any known game time at the first tap. Later choices and retries retain them.
- Keep unfinished drafts only while the modal is visible. Cancel writes nothing; reload discards unfinished selection.
- Every event includes its period. Substitution, fifth-player entry, non-yellow card and powerplay completion require game time. Other events may omit it.
- New recoveries/losses require a defensive/attacking half; entry without coordinates requests an explicit choice; legacy absent location remains unknown. New score corrections affect the opponent only; our goals remain tied to shot history.
- Optional coordinates contain both normalized team-relative x/y values. Rink-first entry follows the observer view and captures time/direction at first valid contact. Desktop shows the rink; phones open a dedicated picker with hold/drag magnification and release-to-continue. Recovery/loss half follows the point, with explicit choice on the halfway line. No rink selection means no coordinates.
- Hide incompatible actions and players. Recheck the same rules inside local and server transactions.
- Keep four or five players on the field and at most one goalkeeper. Outstanding powerplay limits the team to four. Ordinary substitutions exchange two players atomically.
- Yellow has no lineup/powerplay effect. Blue/red affect team capacity even for bench recipients. The third blue triggers permanent red-card exclusion. Team-penalty timers use two minutes for blue and four for direct red, follow playing time and run sequentially; remaining time is correctable. Temporary individual suspension restrictions remain deferred.
- Derive score, lineup, card accumulation and powerplay from non-deleted history. Do not keep a second authoritative mutable copy.

## Acceptance baseline

The implementation should support these scenarios in a production build:

1. Create players, a team and a Match offline after initial sign-in. Reload without losing committed data.
2. Assign the same Player to different teams with independent numbers/roles. Match snapshots preserve historical details.
3. Capture an eligible event through either entry order. Missing required details block saving; optional position never blocks it.
4. Capture known time automatically while running or paused. Manual time permits required timed actions without a running clock.
5. Apply an active or bench card without an invalid lineup. Queue further penalties at four, expire them by playing time or correct them explicitly, then prompt for a fifth player without an outgoing player.
6. Undo the latest eligible event, including its score, lineup, powerplay and third-blue consequences.
7. Reconnect and upload once despite lost acknowledgements or duplicate delivery. Preserve newer local work through acknowledgements and downloads.
8. Pause sync on expiry or account mismatch; retain local work. Sign-out cleanup must not be reversed by late responses.
9. Switch language without losing draft, clock or pending work. Support narrow screens, enlarged text and keyboard/touch access.
10. End periods explicitly and complete the Match. Reopen it as a read-only summary.

## Deferred scope

Cross-match analytics, heatmaps, arbitrary historical editing/deletion, redo, reopening completed matches, official foul rules, individual temporary suspensions, conflict resolution, simultaneous multi-device recording, backup/export, guest accounts, self-service password changes and admin-role management remain in the [Backlog](backlog.md). The approved completed-match summary uses recorded event positions without inferring missing locations or opponent action statistics.

The [Development plan](development-plan.md) distinguishes implemented features, verification evidence and outstanding release checks. Deferred goals are not current acceptance claims.
