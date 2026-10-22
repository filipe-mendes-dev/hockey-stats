import {
  deleteEntityInputSchema,
  deleteEntityCommandSchema,
} from "../../../contracts/entity-deletions.schema";
import type {
  DeleteEntityInput,
  EntityDeletion,
} from "../../../contracts/entity-deletions.schema";
import { playerSchema } from "../../../domain/players/player.schema";
import { teamSchema } from "../../../domain/teams/team.schema";
import { teamPlayerSchema } from "../../../domain/teams/teamPlayer.schema";
import { matchSchema } from "../../../domain/matches/match.schema";
import { getDatabase } from "../../storage/database";
import { notifyLocalDataChanged } from "../../storage/localDataEvents";
import { getLocalIdentity } from "../account/account.repository";
import { LocalAccountRequiredError } from "../account/account.service";
import { LocalRevisionConflictError } from "../teams/teams.errors";
import { insertOutboxOperation } from "../sync/outbox.repository";
import { applyEntityDeletion } from "./deletions.service";
import { deletionStores, getEntityDeletion } from "./deletions.repository";

export async function deleteEntity(input: DeleteEntityInput): Promise<void> {
  const fields = deleteEntityInputSchema.parse(input);
  const database = await getDatabase();
  await database.transaction("rw", deletionStores, async () => {
    if (!(await getLocalIdentity())) throw new LocalAccountRequiredError();
    if (await getEntityDeletion(fields.feature, fields.id))
      throw new LocalRevisionConflictError();
    const row: unknown = await database
      .table<unknown, string>(fields.feature)
      .get(fields.id);
    const schema =
      fields.feature === "players"
        ? playerSchema
        : fields.feature === "teams"
          ? teamSchema
          : fields.feature === "matches"
            ? matchSchema
            : teamPlayerSchema;
    const current = schema.parse(row);
    if (current.revision !== fields.expectedRevision)
      throw new LocalRevisionConflictError();
    const deletedAt = Math.max(Date.now(), current.updatedAt);
    const primary: EntityDeletion = {
      feature: fields.feature,
      id: fields.id,
      revision: current.revision + 1,
      deletedAt,
    };
    if (fields.feature === "players" || fields.feature === "teams") {
      const memberships = await database
        .table<unknown, string>("teamPlayers")
        .where(fields.feature === "players" ? "playerId" : "teamId")
        .equals(fields.id)
        .toArray();
      for (const row of memberships) {
        const member = teamPlayerSchema.parse(row);
        await applyEntityDeletion({
          feature: "teamPlayers",
          id: member.id,
          revision: member.revision + 1,
          deletedAt,
        });
      }
    }
    await applyEntityDeletion(primary);
    const operationId = crypto.randomUUID();
    const kinds = {
      players: "player.delete",
      teams: "team.delete",
      teamPlayers: "teamPlayer.delete",
      matches: "match.delete",
    } as const;
    const command = deleteEntityCommandSchema.parse({
      version: 1,
      operationId,
      kind: kinds[fields.feature],
      id: fields.id,
      expectedRevision: fields.expectedRevision,
      deletedAt,
    });
    await insertOutboxOperation({
      operationId,
      entityId: fields.id,
      status: "pending",
      command,
    });
  });
  notifyLocalDataChanged("write", "all");
}
