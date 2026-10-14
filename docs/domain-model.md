# Domain model

Status: proposed TypeScript contracts for incremental implementation. These examples are documentation, not generated application code. Implement only the variants required by the active phase.

## Ownership and relationships

- An account owns teams, players, memberships and games.
- A player is independent of teams within that account and may belong to several squads or age categories.
- A game tracks one team's perspective and an opponent name.
- A game player snapshots participation, name, jersey number and starting status.
- Every event references a game player, including a team foul.
- Current membership cannot rewrite a historical game roster.
- Working account default: one personal account per user. Shared accounts and invitations are deferred.

## Entity contracts

```ts
interface StoredEntity {
  id: string;
  revision: number;
  createdAt: number;
  updatedAt: number;
}

interface OwnedEntity extends StoredEntity {
  accountId: string;
}

interface Account extends StoredEntity {
  ownerUserId: string;
  name: string;
}

interface Team extends OwnedEntity {
  name: string;
  category?: string;
  season?: string;
  archivedAt?: number;
}

interface Player extends OwnedEntity {
  name: string;
  archivedAt?: number;
}

interface TeamPlayer extends OwnedEntity {
  teamId: string;
  playerId: string;
  jerseyNumber?: string;
  status: "active" | "inactive";
}

interface PeriodSettings {
  number: number;
  label: string;
  durationMs?: number;
  attackDirection: "toward-x0" | "toward-x1" | "unknown";
}

interface Game extends OwnedEntity {
  teamId: string;
  teamNameAtGame: string;
  opponentName: string;
  title?: string;
  scheduledAt?: string;
  competition?: string;
  venueRole?: "home" | "away" | "neutral";
  status: "setup" | "live" | "completed";
  clockDisplay: "count-down" | "count-up";
  periods: PeriodSettings[];
  nextEventOrder: number;
}

interface GamePlayer extends OwnedEntity {
  gameId: string;
  playerId: string;
  playerNameAtGame: string;
  jerseyNumberAtGame?: string;
  startingOnField: boolean;
  availableForRecording: boolean;
}

interface Position {
  x: number;
  y: number;
}

interface GameTime {
  elapsedMs: number;
}

interface EventBase extends OwnedEntity {
  gameId: string;
  gamePlayerId: string;
  order: number;
  period: number;
  gameTime?: GameTime;
  deletedAt?: number;
}

interface SpatialEventBase extends EventBase {
  position?: Position;
}

interface ShotEvent extends SpatialEventBase {
  kind: "shot";
  outcome: "goal" | "on-target" | "off-target" | "blocked";
}

interface BallLossEvent extends SpatialEventBase {
  kind: "ball-loss";
  reason: "intercepted-pass" | "failed-individual-action" | "other";
}

interface BallRecoveryEvent extends SpatialEventBase {
  kind: "ball-recovery";
  subtype: "interception" | "duel" | "loose-ball" | "other";
}

interface TeamFoulEvent extends SpatialEventBase {
  kind: "team-foul";
}

interface CardEvent extends SpatialEventBase {
  kind: "card";
  colour: "yellow" | "blue" | "red";
}

interface PlayerInEvent extends EventBase {
  kind: "player-in";
  gameTime: GameTime;
  position?: never;
}

interface PlayerOutEvent extends EventBase {
  kind: "player-out";
  gameTime: GameTime;
  position?: never;
}

type GameEvent =
  | ShotEvent
  | BallLossEvent
  | BallRecoveryEvent
  | TeamFoulEvent
  | CardEvent
  | PlayerInEvent
  | PlayerOutEvent;
```

The type alias expresses a discriminated union, which an interface cannot replace. Runtime validation must reject incompatible fields as well as missing required fields.

`revision` describes the confirmed entity version. Local pending projections and their sequence metadata live in persistence envelopes, not in a fake server acknowledgement. Game mutation commands also use an aggregate revision for ordered synchronization. Define those envelopes and command contracts in the synchronization slice.

Use client-generated stable IDs. `createdAt` preserves local entry time; it is not a globally trustworthy ordering clock. Server operation receipts separately record acceptance time. No `source` field is required for game time.

## Shot vocabulary

Working default based on the user's preferred wording:

| Outcome | Meaning |
| --- | --- |
| `goal` | The shot scored. |
| `on-target` | A non-goal, unblocked shot directed at the goal, usually saved. |
| `off-target` | A non-goal shot that missed the target. |
| `blocked` | A shot stopped before an on-target/off-target outcome was established. |

These are mutually exclusive recorder outcomes. A future aggregate named shots on target would include goals plus `on-target` events under this working definition. The recorder does not yet calculate that statistic.

Confirm edge cases before the shot phase. Do not claim this is an official federation taxonomy or silently use `on-target` to mean both the event outcome and an inclusive aggregate. Revisiting the labels does not block the first recovery slice.

## Invariants

1. References stay within one account. An event's roster entry belongs to its game.
2. Team membership is unique per team/player pair in V1. A game roster contains a player at most once.
3. Referenced historical identities are archived, not hard-deleted.
4. Names and jersey numbers are copied into game snapshots intentionally. Events reference snapshots rather than duplicating their display fields.
5. Jersey numbers are strings. Duplicate numbers generate a setup warning rather than an invented rule.
6. Every event requires a game player. Recovery subtype, loss reason, shot outcome and card colour are mandatory where applicable.
7. Period identifiers are positive and belong to the game's configured periods.
8. Player-in/out require period and game time. Other event variants may omit game time; coordinates are optional for spatial events. Missing values never become zero by default.
9. Supplied time is finite, non-negative elapsed milliseconds in the selected period.
10. Supplied coordinates contain both finite values in `[0, 1]`. Movement events reject them.
11. Cards never modify lineup automatically. Movement events require no paired replacement.
12. Active-player counts are derived and have no hard-coded regulation limit.
13. Live entry rejects putting an already active player in or taking an absent player out.
14. Other event types may reference a bench player. Show the player's state without inventing an on-field-only restriction.
15. A period change does not reset the lineup.

An active clock is not required for movement entry. Capture a known clock value automatically or require manual period/time before commit. Validate the requirement in the browser and API, including historical edits; a movement timestamp cannot be cleared. If the clock has not been established, do not substitute zero or wall-clock creation time.

PostgreSQL enforces relational/unique constraints. IndexedDB workflows check the same relationships within their local transactions because IndexedDB has no SQL foreign keys. Server services revalidate uploaded commands against authorized current state.

## Roster corrections

Before recording, roster and starter choices are freely editable. After recording begins:

- Add a missed player as another snapshot.
- Disable availability rather than removing referenced entries.
- Treat starter changes as historical corrections with a replay preview.
- Preserve historical names and numbers when current player or membership details change.
- Do not add a required TeamPlayer reference to GamePlayer that could make old participation depend on current membership.

## Event order and statistics time

Use explicit event order for timeline, corrections and lineup replay. Normal edits preserve it. Historical insertion or movement is an explicit operation, not a side effect of changing a timestamp.

Period plus elapsed game time is suitable for chronological statistical views when present. It is insufficient as the only stable order because times can be missing, equal, rounded or corrected. Such views need a deterministic event-order tie-breaker and an explicit policy for untimed events. Future statistics must state how untimed events affect each metric.

Countdown is the default display. Store elapsed time so chronological comparisons remain consistent across periods. Display remaining time as configured period duration minus elapsed time. A period's duration becomes historical configuration once timed events reference it; changing it needs a deliberate correction, not a generic settings edit.

## Corrections and undo

Use current event rows, increasing revisions, soft-delete tombstones and a durable operation journal. Keep typed before/after data for local undo. Server commands express validated intent; do not trust client-provided before-images to overwrite SQL rows.

Undo is another durable operation. If an original command has already been sent or accepted, send the inverse after it. A lost acknowledgement means its server status is unknown, so do not simply remove it from the queue. Server receipts make retry safe.

Undo must reject stale state or show a conflict instead of overwriting unrelated changes. Compound edits apply and undo atomically within each database. There is no atomic transaction spanning both databases.

### Contradictory movement example

1. Alex starts on the field.
2. Event 10 records Alex out.
3. Event 20 records Alex in.
4. The observer deletes event 10.

Alex was then never taken off, so event 20 asks to put an already active player in. The same problem can follow a starter correction, player reassignment or event reorder.

Policy for explicit historical corrections:

- Preview downstream contradictions before committing.
- Preserve affected movement events and visibly flag them.
- Replay redundant transitions as no-ops, never as duplicate active players or negative counts.
- Keep the warning visible until the observer fixes the history.
- Require explicit acceptance of a correction that leaves contradictions.
- Never silently delete or rewrite another event.

Use the same deterministic replay and diagnostics on client and server. A server receiving an intentionally accepted correction must not reject it merely because ordinary live-entry validation would reject the resulting redundant movement. Structural validation still applies.

## Derived data

Derive lineup from snapshots and non-deleted movements. Do not persist a separate authoritative active count, player stint, field half or shot zone initially.

Movement boundaries have mandatory time. Playing-time intervals can still be unknown/flagged when final game time or period duration is missing, manually corrected times are inconsistent or movement history contradicts itself. Do not invent durations. Analytics remain outside recorder V1.
