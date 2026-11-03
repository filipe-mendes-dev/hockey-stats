import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveLineupTimeline } from "../../../src/domain/matches/lineupTimeline";
import {
  createEvent,
  createSnapshot,
  minute,
  playerId,
  shot,
  substitution,
} from "./fixtures";

describe("player lineup timeline", () => {
  it("shows chronological stints and merges uninterrupted players across substitutions", () => {
    const snapshot = createSnapshot(true);
    const timeline = deriveLineupTimeline(snapshot, [
      shot(snapshot, 1, 10),
      substitution(snapshot, 2, 8),
    ]);
    const first = timeline[0];
    assert.ok(first);
    assert.equal(first.unknownFromMs, undefined);
    assert.deepEqual(
      first.stints.filter(
        (stint) => stint.matchPlayerId === playerId(snapshot, "A"),
      ),
      [
        {
          matchPlayerId: playerId(snapshot, "A"),
          startMs: 0,
          endMs: 8 * minute,
        },
      ],
    );
    assert.deepEqual(
      first.stints.filter(
        (stint) => stint.matchPlayerId === playerId(snapshot, "B"),
      ),
      [
        {
          matchPlayerId: playerId(snapshot, "B"),
          startMs: 0,
          endMs: 20 * minute,
        },
      ],
    );
    assert.deepEqual(
      first.stints.filter(
        (stint) => stint.matchPlayerId === playerId(snapshot, "E"),
      ),
      [
        {
          matchPlayerId: playerId(snapshot, "E"),
          startMs: 8 * minute,
          endMs: 20 * minute,
        },
      ],
    );
  });

  it("stops confirmed stints at a substitution conflict and marks later periods uncertain", () => {
    const snapshot = createSnapshot(true);
    const events = [
      substitution(snapshot, 1, 12),
      substitution(snapshot, 2, 8, "E", "F"),
    ];
    const timeline = deriveLineupTimeline(snapshot, events);
    assert.equal(timeline[0]?.unknownFromMs, 8 * minute);
    assert.equal(timeline[0]?.issue?.event?.order, 2);
    assert.ok(timeline[0]?.stints.every((stint) => stint.endMs <= 8 * minute));
    assert.equal(timeline[1]?.unknownFromMs, 0);
    assert.deepEqual(timeline[1]?.stints, []);
  });

  it("shows the valid prefix rather than displaying a later contradictory goal as valid", () => {
    const snapshot = createSnapshot(true);
    const timeline = deriveLineupTimeline(snapshot, [
      shot(snapshot, 1, 12, "A"),
      substitution(snapshot, 2, 8),
    ]);
    assert.equal(timeline[0]?.unknownFromMs, 12 * minute);
    assert.equal(timeline[0]?.issue?.event?.order, 1);
    assert.equal(timeline[0]?.issue?.reason, "player-off-field");
  });

  it("does not turn a missing end time into a full planned stint", () => {
    const snapshot = createSnapshot(true);
    snapshot.match.closedPeriods[0] = { number: 1 };
    const timeline = deriveLineupTimeline(snapshot, [
      substitution(snapshot, 1, 8),
      shot(snapshot, 2, 10),
    ]);
    assert.equal(timeline[0]?.extentMs, 20 * minute);
    assert.equal(timeline[0]?.unknownFromMs, 10 * minute);
    assert.ok(timeline[0]?.stints.every((stint) => stint.endMs <= 10 * minute));
    assert.equal(timeline[1]?.unknownFromMs, undefined);
    assert.ok(
      timeline[1]?.stints.some(
        (stint) => stint.matchPlayerId === playerId(snapshot, "E"),
      ),
    );
  });

  it("keeps an untimed legacy lineup consequence uncertain for the entire period", () => {
    const snapshot = createSnapshot(true);
    const legacy = createEvent(snapshot, 1, undefined, {
      kind: "card",
      colour: "red",
      matchPlayerId: playerId(snapshot, "A"),
    });
    const timeline = deriveLineupTimeline(snapshot, [
      shot(snapshot, 2, 10),
      legacy,
    ]);
    assert.equal(timeline[0]?.unknownFromMs, 0);
    assert.deepEqual(timeline[0]?.stints, []);
  });

  it("omits deleted changes without mutating the saved history", () => {
    const snapshot = createSnapshot(true);
    const change = substitution(snapshot, 1, 8);
    const events = [{ ...change, deletedAt: change.updatedAt }];
    const before = structuredClone(events);
    const timeline = deriveLineupTimeline(snapshot, events);
    assert.equal(timeline[0]?.unknownFromMs, undefined);
    assert.equal(
      timeline[0]?.stints.some(
        (stint) => stint.matchPlayerId === playerId(snapshot, "E"),
      ),
      false,
    );
    assert.deepEqual(events, before);
  });
});
