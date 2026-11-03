import {
  applyMatchControl,
  controlMatchInputSchema,
  InvalidMatchControlError,
} from "../../../domain/matches/matchControl";
import type { ControlMatchInput } from "../../../domain/matches/matchControl";
import type { MatchSnapshot } from "../../../domain/matches/match.schema";
import { getDatabase } from "../../storage/database";
import { notifyLocalDataChanged } from "../../storage/localDataEvents";
import { getLocalIdentity } from "../account/account.repository";
import { LocalAccountRequiredError } from "../account/account.service";
import { insertOutboxOperation } from "../sync/outbox.repository";
import { getMatchSnapshot, updateMatch } from "./matches.repository";
export async function controlMatchInTransaction(
  input: ControlMatchInput,
): Promise<MatchSnapshot> {
  const fields = controlMatchInputSchema.parse(input);
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
      version: 2,
      operationId,
      kind: "match.control",
      expectedRevision: current.match.revision,
      action: fields.action,
      ...snapshot,
    },
  });
  return snapshot;
}

export async function controlMatch(
  input: ControlMatchInput,
): Promise<MatchSnapshot> {
  const database = await getDatabase();
  const result = await database.transaction(
    "rw",
    ["metadata", "matches", "matchPlayers", "outbox"],
    () => controlMatchInTransaction(input),
  );
  notifyLocalDataChanged("write", "matches");
  return result;
}
