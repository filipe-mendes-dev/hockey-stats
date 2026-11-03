import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getMatchEventsAtTime,
  sortMatchEvents,
} from "../../../src/domain/matches/matchEventOrder";
import { createSnapshot, minute, shot, substitution } from "./fixtures";

describe("match event chronology", () => {
  it("places a late substitution at its game time without changing saved order", () => {
    const snapshot = createSnapshot();
    const events = [
      shot(snapshot, 1, 10),
      substitution(snapshot, 2, 8),
      shot(snapshot, 3, 12),
    ];
    const before = structuredClone(events);
    assert.deepEqual(
      sortMatchEvents(events, true).map((event) => event.order),
      [3, 1, 2],
    );
    assert.deepEqual(events, before);
  });

  it("orders periods before elapsed time and breaks ties by recording order", () => {
    const snapshot = createSnapshot();
    const events = [
      shot(snapshot, 1, 19),
      shot(snapshot, 2, 1, "B", 2),
      shot(snapshot, 3, 1, "B", 2),
    ];
    assert.deepEqual(
      sortMatchEvents(events, true).map((event) => event.order),
      [3, 2, 1],
    );
    assert.deepEqual(
      sortMatchEvents(events).map((event) => event.order),
      [1, 2, 3],
    );
  });

  it("keeps untimed events after timed events within their period in either direction", () => {
    const snapshot = createSnapshot();
    const events = [
      shot(snapshot, 1, undefined),
      shot(snapshot, 2, 10),
      shot(snapshot, 3, undefined),
      shot(snapshot, 4, 1, "B", 2),
    ];
    assert.deepEqual(
      sortMatchEvents(events, true).map((event) => event.order),
      [4, 2, 3, 1],
    );
    assert.deepEqual(
      sortMatchEvents(events).map((event) => event.order),
      [2, 1, 3, 4],
    );
  });

  it("excludes tombstones and includes zero-time events", () => {
    const snapshot = createSnapshot();
    const removed = shot(snapshot, 1, 10);
    const zero = shot(snapshot, 2, 0);
    assert.deepEqual(
      sortMatchEvents([{ ...removed, deletedAt: removed.updatedAt }, zero]),
      [zero],
    );
  });

  it("selects history at a captured time without applying later substitutions", () => {
    const snapshot = createSnapshot();
    const events = [substitution(snapshot, 1, 10), shot(snapshot, 2, 8)];
    assert.deepEqual(
      getMatchEventsAtTime(events, {
        period: 1,
        gameTime: { elapsedMs: 8 * minute },
      }).map((event) => event.order),
      [2],
    );
  });
});
