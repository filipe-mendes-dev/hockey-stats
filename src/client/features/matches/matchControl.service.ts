import {
  applyMatchControl,
  controlMatchInputSchema,
  InvalidMatchControlError,
} from "../../../domain/matches/matchControl";
import type { ControlMatchInput } from "../../../domain/matches/matchControl";
import { getDatabase } from "../../storage/database";
import { notifyLocalDataChanged } from "../../storage/localDataEvents";
import { getLocalIdentity } from "../account/account.repository";
import { LocalAccountRequiredError } from "../account/account.service";
import { insertOutboxOperation } from "../sync/outbox.repository";
import { getMatchSnapshot, updateMatch } from "./matches.repository";
export async function controlMatch(input: ControlMatchInput) {
  const fields = controlMatchInputSchema.parse(input);
  const database = await getDatabase();
  const result = await database.transaction(
    "rw",
    ["metadata", "matches", "matchPlayers", "outbox"],
    async () => {
      if (!(await getLocalIdentity())) throw new LocalAccountRequiredError();
      const current = await getMatchSnapshot(fields.id);
      if (!current || current.match.revision !== fields.expectedRevision)
        throw new InvalidMatchControlError();
      const match = applyMatchControl(
        current.match,
        fields.action,
        Math.max(Date.now(), current.match.updatedAt),
      );
      const snapshot = { ...current, match };
      await updateMatch(match);
      const operationId = crypto.randomUUID();
      await insertOutboxOperation({
        operationId,
        entityId: match.id,
        status: "pending",
        command: {
          version: 1,
          operationId,
          kind: "match.control",
          expectedRevision: current.match.revision,
          action: fields.action,
          ...snapshot,
        },
      });
      return snapshot;
    },
  );
  notifyLocalDataChanged("write", "matches");
  return result;
}
