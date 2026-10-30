# Domain model

This document describes the current prototype. Executable contracts live in `src/domain` and `src/contracts`; do not maintain duplicate TypeScript interfaces in documentation.

## Entities and relationships

Completed-match sharing adds one server-only Match permission with a unique random token and creation time. It references existing Match data rather than copying recordings or statistics, does not advance domain revisions and cascades on server Match deletion. The public presentation model is derived and contains no reusable Player/Team identities or delivery/debugging records. See [Completed-match sharing](match-sharing.md).

| Entity            | Current meaning                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Player            | Reusable identity with name, stable client UUID, revision and creation/update timestamps. Duplicate names are valid.       |
| Team              | Name and optional category/season, with revision and timestamps.                                                           |
| TeamPlayer        | Unique Team/Player membership with optional jersey number and field-player/goalkeeper role. No membership status.          |
| Match             | Team snapshot name, opponent, optional date/venue, setup/live/completed status, periods, clock and one aggregate revision. |
| MatchPlayer       | Match-specific Player identity/name/number/role/starter snapshot. Events reference this ID.                                |
| MatchEvent        | Strict event variant with Match, period, capture time, explicit order, revision and persistence timestamps.                |
| Local identity    | One metadata ownerUserId and display name. No credentials or workspace.                                                    |
| Outbox operation  | Stable operation ID, immutable command, entity scope, local sequence and pending/blocked status.                           |
| Match history     | Local event/creation-operation association that retains latest-event Undo eligibility after upload.                        |
| Operation receipt | PostgreSQL record of the accepted request/result, unique by authenticated owner and operation ID.                          |

A Player may belong to multiple Teams with different numbers/roles. MatchPlayer snapshots intentionally survive later Team/Player/membership changes. A Match contains a Player at most once. Jersey numbers are strings; duplicates warn rather than block.

SQL records use authenticated ownership and relational constraints. Local entities share one owner-bound dataset. UUIDs and capture/creation timestamps originate on the client; server receipt acceptance time is separate.

## Removal and historical references

Player and Team logical deletion sets archivedAt, advances revision and removes their current TeamPlayer memberships. SQL retains the identity rows, so existing Match.teamId and MatchPlayer.playerId references remain valid. Existing setup call-ups can retain removed Players and start from their snapshots; future selection excludes removed identities. Existing setup metadata edits remain valid after Team removal. A membership can be added again with a fresh UUID after removal, while its old ID stays terminal.

Match deletion removes the entire recording: events, MatchPlayers and local Undo history. Delete the event graph before SQL cascades remove MatchPlayers with restrictive references. Teams and Players remain intact. A live Match is discarded explicitly rather than marked completed.

An owner-scoped entity_deletion ledger and local entityDeletions store record feature, UUID, next revision and removal time. These markers are terminal and downloaded explicitly. They have no foreign key to the removed entity and survive physical Match/membership cleanup. A deletion command has a stable operation ID, expected revision and captured removal time. Services own cascade decisions and transactions; repositories perform the stored-row operations. Restore and permanent purging are deferred.

## Match setup and lifecycle

Call-ups allow at most eight field players and two goalkeepers, ten total. Setup may be incomplete. Only setup Matches can edit metadata/call-up. Existing selected MatchPlayer IDs and historical names are retained through pre-start edits.

New Matches configure exactly two sequential halves with equal positive durations during creation; setup detail editing can change that format. The Match stores the chosen durations rather than deriving them again from the Team. Legacy setup snapshots with no periods and existing live/completed formats remain readable. Legacy setup must receive a duration through Edit details before starting. Start requires exactly four field starters and one goalkeeper and uses the stored two-half configuration. Periods remain a sequential array so historical formats stay readable. Starting establishes elapsed time zero with a paused clock. The live lineup can later contain four or five players and at most one goalkeeper; zero goalkeepers is valid.

End period closes the current period and advances to the next with a paused zero clock. End match is available in the final configured period and marks the Match completed. Completed data is read-only. Reopening or correcting lifecycle transitions is deferred.

## Event contracts

All events require Match ID, configured period and capturedAt. Stored rows add stable ID, explicit per-Match order, revision, createdAt and updatedAt. Undo retains a tombstone with deletedAt. Never reuse an order after Undo.

| Kind               | Required details                                                                                                                                                           | Optional context                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `ball-recovery`    | MatchPlayer, defensive/attacking rink half and subtype: interception, duel, loose-ball, intercepted-shot or other.                                                         | Game time, position.                 |
| `ball-loss`        | MatchPlayer, defensive/attacking rink half and reason: intercepted-pass, failed-individual-action, poor-reception or other.                                                                | Game time, position.                 |
| `shot`             | MatchPlayer, attemptType for new shots: open-play, penalty or direct-free-hit, and outcome: goal, on-target, off-target or blocked.                                        | Game time, position.                 |
| `team-foul`        | MatchPlayer.                                                                                                                                                               | Game time, position.                 |
| `card`             | Recipient MatchPlayer, yellow/blue/red, explicit lineup effect and current powerplay semantics. Non-yellow requires game time and any required removed/replacement Player. | Position; yellow may omit game time. |
| `substitution`     | Distinct outgoing/incoming MatchPlayers and game time.                                                                                                                     | None.                                |
| `powerplay-adjust` | Current penalty’s card-event ID, positive remaining duration and game time.                                                                                                | None.                                |
| `powerplay-end`    | Current penalty's card-event ID and game time.                                                                                                                             | None.                                |
| `player-in`        | Eligible bench MatchPlayer, powerplay-ended entry reason and game time.                                                                                                    | None.                                |
| `opponent-goal`    | Match-level goal with optional captured goalkeeper MatchPlayer attribution.                                                                                                | Game time.                           |
| `score-adjustment` | New corrections require ownDelta zero and a nonzero opponentDelta; historical own-score adjustments stay readable.                                                         | Game time.                           |

| `goalkeeper-save` | Active goalkeeper MatchPlayer and simple/difficult classification for new inputs. | Game time; historical classification may be absent. |
| `timeout` | Team: own or opponent. | Game time. |

Recorder labels map duel to Tackle and intercepted-pass to Bad pass; canonical identifiers and historical records stay unchanged. Loose-ball includes rebounds and second balls. Poor-reception is a new reason for losing an incoming pass before establishing control; historical Other records are never automatically reassigned.

Strict discriminated schemas reject missing or incompatible fields. `colour` is the displayed card colour. Recovery/loss half is required for new inputs but optional in stored legacy records. Missing historical location remains unknown. New penalty/direct-free-hit attempts carry the fixed restart spot from shared rink constants; other absent coordinates are never synthesized. Score deltas change the relevant score by the signed amount; they are not replacement totals. Goal shots add to our score; opponent goals add to the opponent score. Score history must remain nonnegative and within safe integers.

Shot type is independent of outcome. Historical absent attemptType remains unknown. Special attempts remain one shot and one possible goal, with fixed coordinates describing the restart spot rather than observed shot release. Timeouts and saves never change the clock, lineup or score. Fouls remain our player-attributed fouls only.

Shot outcomes are exclusive. `on-target` means a non-goal, unblocked attempt directed at goal. The completed-summary team shots-on-target statistic includes both goal and on-target outcomes. Player shot columns and the outcome breakdown keep goals, non-goal on-target, off-target and blocked separate. Shot conversion is goal shots divided by all shots; a zero denominator displays unavailable rather than an invented percentage. Historical score adjustments affect the result but do not create shot attempts.

### Completed-summary statistics

Derive team/player action counts from non-deleted events and retain MatchPlayer snapshot identities. A period selection filters team and player statistics; action category and optional player selection filter only the event map, its breakdown and timeline. The final result and period score summary remain unfiltered. Opponent statistics are limited to the recorded score.

Playing time uses starters, explicit recorded lineup changes and each closed period's saved elapsed end time. Automatic penalty expiry never inserts a player. Replay by period and saved elapsed game time, using recording order to break equal-time ties. Recording an earlier event later does not itself invalidate playing time. Missing period end time, untimed lineup changes, contradictory chronological replay or an event after the saved period end make playing time unavailable. Uncertain lineup history also prevents reliable later-period time. An all-match total requires reliable times in every period; planned duration and wall time never substitute for missing played time. Score corrections do not identify the original scoring period, so a history containing a non-deleted correction shows unavailable period scores. The final result still includes the correction.

Before saving a new event or Undo, validate the resulting chronological history, including later registered actions. An outgoing player cannot perform an on-field action later without a recorded re-entry. Bench cards remain valid. Validate substitutions, goalkeeper roles, exclusions, lineup capacity and penalty state at each known timestamp. Reject a backdated insertion when untimed history in that period prevents verification. Existing saved records remain readable and are never reordered or repaired in storage. Recording order still identifies the latest Undo candidate. Retrospective editing and a dedicated late-entry interface remain deferred.

Both timelines show the latest game event first, ordered by period and elapsed game time. Equal timestamps retain reverse recording order. Untimed events form a trailing group within their period and retain an explicit unavailable-time label; no timestamp is inferred from capture or creation time.

Goalkeeper summaries count total recorded saves and simple/difficult saves, captured goalkeeper attribution for conceded goals and reliable playing time. Missing historical recording is not evidence of complete save statistics. No save percentage is inferred from partial data. Shot metadata preserves unknown history and special attempts without double counting; summaries omit a separate shot-type breakdown. Own/opponent timeout counts follow the selected period.

Plot explicit event coordinates and fixed set-piece restart spots, always in one team-relative attack direction. Events without coordinates remain in counts and the timeline. Keep a visible positioned/total count. Selection and hover are presentation state and never change the history or synchronization queue.

## Eligibility and lineup

| Action               | Eligible players                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Recovery, loss, shot | Active field players.                                                                               |
| Goalkeeper save      | Active goalkeeper only.                                                                             |
| Foul                 | Active players, including goalkeeper.                                                               |
| Card                 | Called-up players who are not permanently ejected, including bench/goalkeeper.                      |
| Substitution         | Active outgoing and eligible bench incoming player yielding a valid lineup.                         |
| Player in            | Eligible bench player when four are active and no powerplay remains; preserve the goalkeeper limit. |

Hide unavailable options in either selection order. Recheck the same pure guards transactionally before writing. Ordinary substitutions always exchange two players in one event and one Undo action. Independent player-out creation is not part of the current flow.

## Cards and powerplay

Yellow records the card without changing lineup or powerplay. No automatic yellow-card accumulation rule is implemented.

Every new blue/red card creates one team penalty. Derived state keeps its card-event IDs in order. The first is current and the rest are queued. While any remains, the maximum lineup is four. Further penalties extend the queue instead of reducing the team below four.

| Before card                     | Required effect                              |
| ------------------------------- | -------------------------------------------- |
| Five active, recipient active   | Remove the recipient.                        |
| Five active, recipient on bench | Observer chooses an active player to remove. |
| Four active, recipient active   | Choose an eligible replacement; keep four.   |
| Four active, recipient on bench | Keep lineup unchanged; queue the penalty.    |

The recipient and removed player can be different people. Persist the required lineup change and penalty with the card atomically. Reject a transition without a valid replacement at the minimum.

New blue cards carry a saved two-minute team penalty; direct red cards carry four minutes. The third blue retains a single two-minute team penalty alongside permanent exclusion. Penalties expire against playing time, pause with the Match clock and carry unused time into the next half. Queued penalties run sequentially. Match-clock corrections move pending deadlines. Expiry is derived from saved card/event times and the clock anchor, without background event writes. Choices at an earlier timestamp use the historical penalty state; new event validation also checks that later registered Player in actions remain valid. Legacy queued commands retain their recording-order replay. Goals do not end penalties.

Correct powerplay adjusts the current penalty’s remaining time or records explicit completion when set to zero. If another remains, capacity stays four. Otherwise capacity returns to five and the recorder opens Player in, recording actual entry as a separate timed event without an outgoing player. No player is inserted automatically. Legacy cards without a duration remain manual until corrected; historical completion events retain their meaning.

Count non-deleted blue cards per Player. A new third blue produces permanent red exclusion within that same card action. Preserve the blue history and display the red consequence; do not create a second synthetic command or team penalty. Direct red also excludes the Player permanently.

By explicit prototype scope, temporary individual suspension restrictions are not enforced. A previously blue-carded bench player can substitute during powerplay. Personal suspension expiry remains backlog work. Team-penalty timers and the Player in prompt do not enforce individual temporary suspension restrictions.

## Time, position and derived state

Capture period and any known game time on the first entry tap. Known paused time is valid; no running clock is required. Required timed actions request manual remaining time when unknown, with explicitly labelled elapsed-time entry for legacy formats without a duration. Missing time is never replaced with wall time or an invented zero. Store elapsed milliseconds per period; every known event timestamp and the live clock share countdown formatting from that period’s duration, rounded up to whole seconds. Unknown duration/time displays unavailable time; legacy manual entry can still use explicitly labelled elapsed values. Corrections affect future captures only.

Optional position always contains finite x and y in `[0, 1]`. Looking toward the opponent goal, x runs left to right and y from our defensive end zero to attack one. Observed positions come from explicit rink selection. Penalty/direct-free-hit positions come from shared fixed team-relative restart spots. Period attackDirection is per-period metadata, independent of the coordinate frame. The recorder may update only the current live period through the revision-checked period.direction control; other periods and event coordinates remain unchanged. Rink selection converts the observer view into this team-relative frame using direction captured at first contact. Moving the selection retains capture identity/time. Recovery/loss half is derived from y below/above 0.5; exactly 0.5 requires explicit choice. Direction corrections never rewrite saved coordinates.

`deriveMatchState` replays non-deleted events from starters to produce lineup, score, blue counts, ejections and powerplay. The queue and maximum count are derived, not separately persisted Match fields. Explicit order controls replay even when game time is missing or corrected.

## Undo and compatibility

Undo targets the latest non-deleted event only when this browser retains its local creation history. It atomically tombstones the event, marks history undone, advances Match revision and queues an inverse. Replay must remain valid. Clock controls and period transitions are not event Undo operations. Completed Matches cannot Undo; there is no redo or arbitrary historical edit/delete UI.

New event/Undo commands use version 9, adding poor-reception while retaining version-8 chronological validation and required save difficulty. Versions 1–8 cannot create or undo the new reason; their existing queued payloads remain accepted through their preceding paths. Version 6 introduced expanded shots, saves, timeouts, goalkeeper attribution and intercepted-shot recovery with optional save difficulty; its frozen validation preserves queued work. Versions 1–6 remain readable. Pre-v6 event mutations conflict once expanded history exists, including tombstones. New match controls use version 2; version-1 controls conflict on expanded histories. Setup/create/Start remain version 1 and cannot modify a live recording. Exact accepted receipts still replay. Version 5 introduced timed cards and powerplay correction; pre-v5 writes conflict once timed-powerplay events exist, while accepted receipts still replay. Version 4 requires recovery/loss half and opponent-only score corrections. Pre-v4 writes also conflict once rink-half events exist. Older stored independent movements, cards and suspension-end events remain readable; old suspension-end records no longer impose temporary availability state. New cards carry startsPowerplay explicitly so historical cards are not silently converted into unfinished penalties. Legacy delivery rules are described in [Offline and sync](offline-sync.md).

Future historical corrections must preview downstream contradictions and never silently rewrite another event. They require a separate agreed protocol before implementation.

Player name edits advance the reusable Player revision and preserve its ID/creation time. Duplicate names remain valid. New match selections use the current Player name, while already captured MatchPlayer names remain unchanged in setup, live and completed Matches. Rename never changes TeamPlayer membership numbers/roles or event history.
