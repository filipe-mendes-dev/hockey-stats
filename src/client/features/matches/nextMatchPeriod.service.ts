import {
  getPeriodSubstitutions,
  nextMatchPeriodInputSchema,
} from "../../../domain/matches/nextMatchPeriod";
import type { NextMatchPeriodInput } from "../../../domain/matches/nextMatchPeriod";
import type { MatchSnapshot } from "../../../domain/matches/match.schema";
import { getDatabase } from "../../storage/database";
import { notifyLocalDataChanged } from "../../storage/localDataEvents";
import { controlMatchInTransaction } from "./matchControl.service";
import { addMatchEventInTransaction } from "./matchEvents.service";
import { listMatchEvents } from "./matchEvents.repository";
import { getMatchSnapshot } from "./matches.repository";
import { InvalidMatchControlError } from "../../../domain/matches/matchControl";

export async function startNextMatchPeriod(
  input: NextMatchPeriodInput,
): Promise<MatchSnapshot> {
  const fields = nextMatchPeriodInputSchema.parse(input);
  const database = await getDatabase();
  const result = await database.transaction(
    "rw",
    [
      "metadata",
      "matches",
      "matchPlayers",
      "matchEvents",
      "matchHistory",
      "outbox",
    ],
    async () => {
      let snapshot = await controlMatchInTransaction({
        id: fields.id,
        expectedRevision: fields.expectedRevision,
        action: { type: "period.end" },
      });
      const direction = snapshot.match.periods.find(
        (period) => period.number === snapshot.match.currentPeriod,
      )?.attackDirection;
      if (direction !== fields.attackDirection)
        snapshot = await controlMatchInTransaction({
          id: fields.id,
          expectedRevision: snapshot.match.revision,
          action: {
            type: "period.direction",
            attackDirection: fields.attackDirection,
          },
        });
      const substitutions = getPeriodSubstitutions(
        snapshot,
        await listMatchEvents(fields.id),
        fields.playerIds,
      );
      for (const substitution of substitutions)
        await addMatchEventInTransaction({
          id: crypto.randomUUID(),
          operationId: crypto.randomUUID(),
          matchId: fields.id,
          period: snapshot.match.currentPeriod,
          capturedAt: snapshot.match.updatedAt,
          gameTime: { elapsedMs: 0 },
          kind: "substitution",
          ...substitution,
        });
      const updated = await getMatchSnapshot(fields.id);
      if (!updated) throw new InvalidMatchControlError();
      return updated;
    },
  );
  notifyLocalDataChanged("write", "matches");
  return result;
}
