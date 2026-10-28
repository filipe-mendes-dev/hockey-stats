import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import {
  validateChronologicalEventAddition,
  validateChronologicalEventHistory,
} from "../../../src/domain/matches/matchChronology";
import {
  deriveChronologicalMatchState,
  deriveMatchState,
} from "../../../src/domain/matches/derivedMatchState";
import { createMatchEventCommandSchema } from "../../../src/contracts/match-events-sync.schema";
import { matchRecordingSchema } from "../../../src/contracts/matches-sync.schema";
import {
  card,
  createEvent,
  createSnapshot,
  minute,
  playerId,
  shot,
  substitution,
} from "./fixtures";

describe("chronological event validation", () => {
  it("refuses new events when a legacy red card has no recorded lineup effect", () => {
    const snapshot = createSnapshot();
    const legacy = createEvent(snapshot, 1, undefined, {
      kind: "card",
      matchPlayerId: playerId(snapshot, "A"),
      colour: "red",
    });
    assert.deepEqual(
      validateChronologicalEventAddition(
        snapshot,
        [legacy],
        shot(snapshot, 2, 12),
      ),
      { allowed: false, reason: "unknown-history-time" },
    );
  });
  it("accepts a late substitution when later actions belong to active players", () => {
    const snapshot = createSnapshot();
    assert.deepEqual(
      validateChronologicalEventAddition(
        snapshot,
        [shot(snapshot, 1, 10)],
        substitution(snapshot, 2, 8),
      ),
      { allowed: true },
    );
  });

  it("rejects removing a player before their already registered goal", () => {
    const snapshot = createSnapshot();
    assert.deepEqual(
      validateChronologicalEventAddition(
        snapshot,
        [shot(snapshot, 1, 12, "A")],
        substitution(snapshot, 2, 8),
      ),
      { allowed: false, reason: "chronology-conflict" },
    );
  });

  it("allows an earlier exit when a recorded re-entry precedes the later goal", () => {
    const snapshot = createSnapshot();
    const events = [
      substitution(snapshot, 1, 12),
      substitution(snapshot, 2, 10, "E", "A"),
      shot(snapshot, 3, 11, "A"),
    ];
    assert.deepEqual(
      validateChronologicalEventAddition(
        snapshot,
        events,
        substitution(snapshot, 4, 8),
      ),
      { allowed: true },
    );
  });

  it("rejects a substitution chain that becomes impossible in game-time order", () => {
    const snapshot = createSnapshot();
    assert.equal(
      validateChronologicalEventAddition(
        snapshot,
        [substitution(snapshot, 1, 12)],
        substitution(snapshot, 2, 8, "E", "F"),
      ).allowed,
      false,
    );
  });

  it("validates a backdated shot against the earlier lineup", () => {
    const snapshot = createSnapshot();
    const events = [substitution(snapshot, 1, 10)];
    assert.equal(
      validateChronologicalEventAddition(
        snapshot,
        events,
        shot(snapshot, 2, 8, "A"),
      ).allowed,
      true,
    );
    assert.deepEqual(
      validateChronologicalEventAddition(
        snapshot,
        events,
        shot(snapshot, 2, 8, "E"),
      ),
      { allowed: false, reason: "player-off-field" },
    );
  });

  it("keeps bench cards valid after substitution", () => {
    const snapshot = createSnapshot();
    const yellow = createEvent(snapshot, 1, 12, {
      kind: "card",
      matchPlayerId: playerId(snapshot, "A"),
      colour: "yellow",
      lineupEffect: "none",
      startsPowerplay: false,
    });
    assert.equal(
      validateChronologicalEventAddition(
        snapshot,
        [yellow],
        substitution(snapshot, 2, 8),
      ).allowed,
      true,
    );
  });

  it("rejects later actions by an excluded player", () => {
    const snapshot = createSnapshot();
    assert.equal(
      validateChronologicalEventAddition(
        snapshot,
        [shot(snapshot, 1, 12, "A")],
        card(snapshot, 2, 8, "red"),
      ).allowed,
      false,
    );
  });

  it("rejects a lineup with two goalkeepers", () => {
    const snapshot = createSnapshot();
    assert.equal(
      validateChronologicalEventAddition(
        snapshot,
        [],
        substitution(snapshot, 1, 8, "A", "Reserve keeper"),
      ).allowed,
      false,
    );
  });

  it("rejects a save attributed to a field player", () => {
    const snapshot = createSnapshot();
    const save = createEvent(snapshot, 1, 8, {
      kind: "goalkeeper-save",
      matchPlayerId: playerId(snapshot, "A"),
      difficulty: "simple",
    });
    assert.equal(
      validateChronologicalEventAddition(snapshot, [], save).allowed,
      false,
    );
  });

  it("uses recording order to resolve simultaneous substitutions and actions", () => {
    const snapshot = createSnapshot();
    const events = [shot(snapshot, 1, 8, "A"), substitution(snapshot, 2, 8)];
    assert.equal(
      validateChronologicalEventHistory(snapshot, events).allowed,
      true,
    );
    assert.equal(
      validateChronologicalEventAddition(
        snapshot,
        [substitution(snapshot, 1, 8)],
        shot(snapshot, 2, 8, "A"),
      ).allowed,
      false,
    );
  });

  it("rejects backdating across untimed history", () => {
    const snapshot = createSnapshot();
    assert.deepEqual(
      validateChronologicalEventAddition(
        snapshot,
        [shot(snapshot, 1, undefined), shot(snapshot, 2, 12)],
        substitution(snapshot, 3, 8),
      ),
      { allowed: false, reason: "unknown-history-time" },
    );
  });

  it("still checks the player when a new action has no game time", () => {
    const snapshot = createSnapshot();
    assert.equal(
      validateChronologicalEventAddition(
        snapshot,
        [],
        shot(snapshot, 1, undefined, "E"),
      ).allowed,
      false,
    );
  });

  it("allows fifth-player entry only after the timed penalty expires", () => {
    const snapshot = createSnapshot();
    const penalty = card(snapshot, 1, 5);
    function entry(time: number) {
      return createEvent(snapshot, 2, time, {
        kind: "player-in",
        matchPlayerId: playerId(snapshot, "E"),
        entryReason: "powerplay-ended",
      });
    }
    assert.equal(
      validateChronologicalEventAddition(snapshot, [penalty], entry(6)).allowed,
      false,
    );
    assert.equal(
      validateChronologicalEventAddition(snapshot, [penalty], entry(7)).allowed,
      true,
    );
  });

  it("rejects a late penalty correction that invalidates a registered fifth-player entry", () => {
    const snapshot = createSnapshot();
    const penalty = card(snapshot, 1, 5);
    const entry = createEvent(snapshot, 2, 7, {
      kind: "player-in",
      matchPlayerId: playerId(snapshot, "E"),
      entryReason: "powerplay-ended",
    });
    const correction = createEvent(snapshot, 3, 6, {
      kind: "powerplay-adjust",
      powerplayCardEventId: penalty.id,
      powerplayDurationMs: 3 * minute,
    });
    assert.deepEqual(
      validateChronologicalEventAddition(
        snapshot,
        [penalty, entry],
        correction,
      ),
      { allowed: false, reason: "chronology-conflict" },
    );
  });

  it("rejects Undo when a surviving goal depends on the removed substitution", () => {
    const snapshot = createSnapshot();
    const events = [shot(snapshot, 1, 12, "E"), substitution(snapshot, 2, 8)];
    assert.equal(
      validateChronologicalEventHistory(snapshot, events).allowed,
      true,
    );
    const change = events[1];
    const goal = events[0];
    assert.ok(change);
    assert.ok(goal);
    assert.equal(
      validateChronologicalEventHistory(snapshot, [
        goal,
        { ...change, deletedAt: change.updatedAt },
      ]).allowed,
      false,
    );
  });

  it("carries lineup history across periods", () => {
    const snapshot = createSnapshot(true);
    assert.equal(
      validateChronologicalEventHistory(snapshot, [
        substitution(snapshot, 1, 8),
        shot(snapshot, 2, 1, "A", 2),
      ]).allowed,
      false,
    );
  });

  it("keeps earlier protocol envelopes readable and accepts version eight", () => {
    const snapshot = createSnapshot();
    for (const version of [6, 7, 8]) {
      assert.equal(
        createMatchEventCommandSchema.safeParse({
          version,
          operationId: randomUUID(),
          expectedRevision: 20,
          kind: "matchEvent.create",
          event: shot(snapshot, 1, 8),
        }).success,
        true,
      );
    }
  });

  it("downloads chronologically valid history even when recording-order replay fails", () => {
    const snapshot = createSnapshot(true);
    const events = [
      substitution(snapshot, 1, 10, "E", "A"),
      substitution(snapshot, 2, 8),
    ];
    assert.equal(deriveMatchState(snapshot, events).valid, false);
    assert.equal(deriveChronologicalMatchState(snapshot, events).valid, true);
    assert.equal(
      matchRecordingSchema.safeParse({ ...snapshot, events }).success,
      true,
    );
  });

  it("keeps old contradictory chronology readable without declaring it valid", () => {
    const snapshot = createSnapshot(true);
    const events = [shot(snapshot, 1, 12, "A"), substitution(snapshot, 2, 8)];
    assert.equal(
      matchRecordingSchema.safeParse({ ...snapshot, events }).success,
      true,
    );
    assert.equal(
      validateChronologicalEventHistory(snapshot, events).allowed,
      false,
    );
  });
});
