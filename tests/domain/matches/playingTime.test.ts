import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { derivePlayingTime } from "../../../src/domain/matches/playingTime";
import { getMatchStatistics } from "../../../src/domain/matches/matchStatistics";
import {
  applyMatchControl,
  getClockElapsed,
} from "../../../src/domain/matches/matchControl";
import {
  createEvent,
  createSnapshot,
  minute,
  playerId,
  shot,
  substitution,
} from "./fixtures";

describe("chronological playing time", () => {
  it("supports adjusting the clock for a substitution and restoring the current time", () => {
    const snapshot = createSnapshot();
    const laterShot = shot(snapshot, 1, 10);
    const now = snapshot.match.updatedAt;
    snapshot.match = applyMatchControl(
      snapshot.match,
      { type: "clock.adjust", elapsedMs: 8 * minute },
      now + 1,
    );
    const captured = getClockElapsed(snapshot.match, now + 2);
    assert.equal(captured, 8 * minute);
    const lateChange = substitution(snapshot, 2, captured / minute);
    snapshot.match = applyMatchControl(
      snapshot.match,
      { type: "clock.adjust", elapsedMs: 12 * minute },
      now + 3,
    );
    assert.equal(getClockElapsed(snapshot.match, now + 4), 12 * minute);
    snapshot.match = applyMatchControl(
      snapshot.match,
      { type: "clock.adjust", elapsedMs: 20 * minute },
      now + 5,
    );
    snapshot.match = applyMatchControl(
      snapshot.match,
      { type: "period.end" },
      now + 6,
    );
    snapshot.match = applyMatchControl(
      snapshot.match,
      { type: "clock.adjust", elapsedMs: 20 * minute },
      now + 7,
    );
    snapshot.match = applyMatchControl(
      snapshot.match,
      { type: "match.end" },
      now + 8,
    );
    const statistics = getMatchStatistics(snapshot, [laterShot, lateChange]);
    assert.equal(laterShot.gameTime?.elapsedMs, 10 * minute);
    assert.equal(lateChange.gameTime?.elapsedMs, 8 * minute);
    assert.equal(
      statistics.players.find((row) => row.player.playerNameAtMatch === "A")
        ?.playingTimeMs,
      8 * minute,
    );
    assert.equal(
      statistics.players.find((row) => row.player.playerNameAtMatch === "E")
        ?.playingTimeMs,
      32 * minute,
    );
  });
  it("calculates the same time for a late substitution as an on-time substitution", () => {
    const snapshot = createSnapshot(true);
    const chronological = derivePlayingTime(snapshot, [
      substitution(snapshot, 1, 8),
      shot(snapshot, 2, 10),
    ]);
    const late = derivePlayingTime(snapshot, [
      shot(snapshot, 1, 10),
      substitution(snapshot, 2, 8),
    ]);
    assert.deepEqual(late, chronological);
    assert.equal(late[0]?.players?.get(playerId(snapshot, "A")), 8 * minute);
    assert.equal(late[0]?.players?.get(playerId(snapshot, "E")), 12 * minute);
    const statistics = getMatchStatistics(snapshot, [
      shot(snapshot, 1, 10),
      substitution(snapshot, 2, 8),
    ]);
    assert.equal(
      statistics.players.find((row) => row.player.playerNameAtMatch === "E")
        ?.playingTimeMs,
      32 * minute,
    );
  });

  it("calculates repeated stints even when substitutions were recorded out of order", () => {
    const snapshot = createSnapshot(true);
    const times = derivePlayingTime(snapshot, [
      substitution(snapshot, 1, 12, "E", "A"),
      substitution(snapshot, 2, 8),
    ]);
    assert.equal(times[0]?.players?.get(playerId(snapshot, "A")), 16 * minute);
    assert.equal(times[0]?.players?.get(playerId(snapshot, "E")), 4 * minute);
  });

  it("marks time unavailable when a later goal conflicts with the lineup", () => {
    const snapshot = createSnapshot(true);
    const times = derivePlayingTime(snapshot, [
      shot(snapshot, 1, 12, "A"),
      substitution(snapshot, 2, 8),
    ]);
    assert.equal(times[0]?.players, undefined);
    assert.equal(times[1]?.players, undefined);
  });

  it("keeps a missing period end unavailable while retaining the other period", () => {
    const snapshot = createSnapshot(true);
    snapshot.match.closedPeriods = [
      { number: 1 },
      { number: 2, elapsedMs: 20 * minute },
    ];
    const times = derivePlayingTime(snapshot, []);
    assert.equal(times[0]?.players, undefined);
    assert.equal(times[1]?.players?.get(playerId(snapshot, "A")), 20 * minute);
    assert.equal(
      getMatchStatistics(snapshot, []).players[0]?.playingTimeMs,
      undefined,
    );
    assert.equal(
      getMatchStatistics(snapshot, [], 2).players[0]?.playingTimeMs,
      20 * minute,
    );
  });

  it("does not substitute planned duration for an early saved period end", () => {
    const snapshot = createSnapshot(true);
    snapshot.match.closedPeriods[0] = { number: 1, elapsedMs: 15 * minute };
    assert.equal(
      derivePlayingTime(snapshot, [
        substitution(snapshot, 1, 8),
      ])[0]?.players?.get(playerId(snapshot, "E")),
      7 * minute,
    );
    assert.equal(
      derivePlayingTime(snapshot, [shot(snapshot, 1, 16)])[0]?.players,
      undefined,
    );
  });

  it("retains the known next-period lineup when only the earlier period end is missing", () => {
    const snapshot = createSnapshot(true);
    snapshot.match.closedPeriods[0] = { number: 1 };
    const times = derivePlayingTime(snapshot, [substitution(snapshot, 1, 8)]);
    assert.equal(times[0]?.players, undefined);
    assert.equal(times[1]?.players?.get(playerId(snapshot, "E")), 20 * minute);
    assert.equal(times[1]?.players?.get(playerId(snapshot, "A")), 0);
  });

  it("does not assume legacy cards without lineup effects preserved the lineup", () => {
    const snapshot = createSnapshot(true);
    const legacy = createEvent(snapshot, 1, undefined, {
      kind: "card",
      matchPlayerId: playerId(snapshot, "A"),
      colour: "red",
    });
    assert.equal(derivePlayingTime(snapshot, [legacy])[0]?.players, undefined);
  });

  it("ignores deleted substitutions and distinguishes known zero from unavailable", () => {
    const snapshot = createSnapshot(true);
    const removed = substitution(snapshot, 1, 8);
    const times = derivePlayingTime(snapshot, [
      { ...removed, deletedAt: removed.updatedAt },
    ]);
    assert.equal(times[0]?.players?.get(playerId(snapshot, "A")), 20 * minute);
    assert.equal(times[0]?.players?.get(playerId(snapshot, "E")), 0);
  });

  it("leaves recorded action counts intact when playing time is contradictory", () => {
    const snapshot = createSnapshot(true);
    const statistics = getMatchStatistics(snapshot, [
      shot(snapshot, 1, 12, "A"),
      substitution(snapshot, 2, 8),
    ]);
    assert.equal(statistics.team.goals, 1);
    assert.equal(
      statistics.players.find((row) => row.player.playerNameAtMatch === "A")
        ?.goals,
      1,
    );
    assert.equal(statistics.players[0]?.playingTimeMs, undefined);
  });
});
