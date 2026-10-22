import type { EntityDeletion } from "../../../contracts/entity-deletions.schema";
import {
  getCommandEntity,
  getCommandFeature,
} from "../../../contracts/sync.schema";
import type { SyncCommand } from "../../../contracts/sync.schema";
import { teamPlayerSchema } from "../../../domain/teams/teamPlayer.schema";
import { getDatabase } from "../../storage/database";
import {
  listOutboxOperations,
  blockOutboxOperation,
} from "../sync/outbox.repository";
import { applyEntityDeletion } from "./deletions.service";

function conflictsWithDeletion(
  command: SyncCommand,
  deletion: EntityDeletion,
): boolean {
  if ("deletedAt" in command) return false;
  if (
    getCommandFeature(command) === deletion.feature &&
    getCommandEntity(command).id === deletion.id
  )
    return true;
  if ("teamPlayer" in command)
    return (
      (deletion.feature === "players" &&
        command.teamPlayer.playerId === deletion.id) ||
      (deletion.feature === "teams" &&
        command.teamPlayer.teamId === deletion.id)
    );
  if (command.kind === "match.create")
    return (
      (deletion.feature === "teams" && command.match.teamId === deletion.id) ||
      (deletion.feature === "players" &&
        command.players.some((player) => player.playerId === deletion.id))
    );
  return false;
}

export async function applyDownloadedDeletions(
  deletions: EntityDeletion[],
): Promise<void> {
  const database = await getDatabase();
  const operations = await listOutboxOperations();
  for (const deletion of deletions) {
    // Include device-only memberships that the server has never received.
    if (deletion.feature === "players" || deletion.feature === "teams") {
      const rows: unknown[] = await database
        .table<unknown, string>("teamPlayers")
        .where(deletion.feature === "players" ? "playerId" : "teamId")
        .equals(deletion.id)
        .toArray();
      for (const row of rows) {
        const member = teamPlayerSchema.parse(row);
        await applyEntityDeletion({
          feature: "teamPlayers",
          id: member.id,
          revision: member.revision + 1,
          deletedAt: deletion.deletedAt,
        });
      }
    }
    await applyEntityDeletion(deletion);
    for (const operation of operations)
      if (conflictsWithDeletion(operation.command, deletion))
        await blockOutboxOperation(operation.operationId, "record_deleted");
  }
}
