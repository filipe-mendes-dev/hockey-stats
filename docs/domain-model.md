# Domain model

This document describes the current prototype. Executable contracts live in `src/domain` and `src/contracts`; do not maintain duplicate TypeScript interfaces in documentation.

## Entities and relationships

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

## Match setup and lifecycle

Call-ups allow at most eight field players and two goalkeepers, ten total. Setup may be incomplete. Only setup Matches can edit metadata/call-up. Existing selected MatchPlayer IDs and historical names are retained through pre-start edits.

Start requires exactly four field starters and one goalkeeper, plus at least one configured period. Periods are sequential positive numbers. Duration is optional, but must be positive when supplied. Starting establishes elapsed time zero. The live lineup can later contain four or five players and at most one goalkeeper; zero goalkeepers is valid.

End period closes the current period and advances to the next with a paused zero clock. End match is available in the final configured period and marks the Match completed. Completed data is read-only. Reopening or correcting lifecycle transitions is deferred.

## Event contracts

All events require Match ID, configured period and capturedAt. Stored rows add stable ID, explicit per-Match order, revision, createdAt and updatedAt. Undo retains a tombstone with deletedAt. Never reuse an order after Undo.

| Kind               | Required details                                                                                                                                                           | Optional context                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `ball-recovery`    | MatchPlayer and subtype: interception, duel, loose-ball or other.                                                                                                          | Game time, position.                 |
| `ball-loss`        | MatchPlayer and reason: intercepted-pass, failed-individual-action or other.                                                                                               | Game time, position.                 |
| `shot`             | MatchPlayer and outcome: goal, on-target, off-target or blocked.                                                                                                           | Game time, position.                 |
| `team-foul`        | MatchPlayer.                                                                                                                                                               | Game time, position.                 |
| `card`             | Recipient MatchPlayer, yellow/blue/red, explicit lineup effect and current powerplay semantics. Non-yellow requires game time and any required removed/replacement Player. | Position; yellow may omit game time. |
| `substitution`     | Distinct outgoing/incoming MatchPlayers and game time.                                                                                                                     | None.                                |
| `powerplay-end`    | Current penalty's card-event ID and game time.                                                                                                                             | None.                                |
| `player-in`        | Eligible bench MatchPlayer, powerplay-ended entry reason and game time.                                                                                                    | None.                                |
| `opponent-goal`    | Match-level event without a Player.                                                                                                                                        | Game time.                           |
| `score-adjustment` | Signed ownDelta/opponentDelta; at least one nonzero.                                                                                                                       | Game time.                           |

Strict discriminated schemas reject missing or incompatible fields. `colour` is the displayed card colour. Score deltas change the relevant score by the signed amount; they are not replacement totals. Goal shots add to our score; opponent goals add to the opponent score. Score history must remain nonnegative and within safe integers.

Shot outcomes are exclusive. `on-target` means a non-goal, unblocked attempt directed at goal. A future inclusive shots-on-target statistic would include both goal and on-target outcomes. Statistics are deferred.

## Eligibility and lineup

| Action               | Eligible players                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Recovery, loss, shot | Active field players.                                                                               |
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

The observer manually ends the current penalty. If another remains, capacity stays four. Otherwise capacity returns to five and a separate timed Player in event records the actual entry, without an outgoing player. Neither penalty completion nor a goal automatically inserts a player or expires a penalty.

Count non-deleted blue cards per Player. A new third blue produces permanent red exclusion within that same card action. Preserve the blue history and display the red consequence; do not create a second synthetic command or team penalty. Direct red also excludes the Player permanently.

By explicit prototype scope, temporary individual suspension restrictions are not enforced. A previously blue-carded bench player can substitute during powerplay. Game-clock-linked penalties, personal expiry and automatic return prompts are backlog work.

## Time, position and derived state

Capture period and any known game time on the first entry tap. Known paused time is valid; no running clock is required. Required timed actions request manual elapsed time when unknown. Missing time is never replaced with wall time or an invented zero. Store elapsed milliseconds per period; show countdown when duration exists. Corrections affect future captures only.

Optional position always contains finite x and y in `[0, 1]`. Looking toward the opponent goal, x runs left to right and y from our defensive end zero to attack one. Position is supplied only by a field click. Period attackDirection remains historical setup metadata, not the coordinate frame. Rink UI is deferred.

`deriveMatchState` replays non-deleted events from starters to produce lineup, score, blue counts, ejections and powerplay. The queue and maximum count are derived, not separately persisted Match fields. Explicit order controls replay even when game time is missing or corrected.

## Undo and compatibility

Undo targets the latest non-deleted event only when this browser retains its local creation history. It atomically tombstones the event, marks history undone, advances Match revision and queues an inverse. Replay must remain valid. Clock controls and period transitions are not event Undo operations. Completed Matches cannot Undo; there is no redo or arbitrary historical edit/delete UI.

Event commands use version 3. Older stored independent movements, cards and suspension-end events remain readable; old suspension-end records no longer impose temporary availability state. New cards carry startsPowerplay explicitly so historical cards are not silently converted into unfinished penalties. Legacy delivery rules are described in [Offline and sync](offline-sync.md).

Future historical corrections must preview downstream contradictions and never silently rewrite another event. They require a separate agreed protocol before implementation.
