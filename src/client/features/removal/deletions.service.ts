import type { EntityDeletion } from "../../../contracts/entity-deletions.schema";
import { getPlayerById, putPlayer } from "../players/players.repository";
import { getTeamById, updateTeamRecord } from "../teams/teams.repository";
import { deleteTeamPlayerRecord } from "../teams/teamPlayers.repository";
import { deleteMatchRecording } from "../matches/matches.repository";
import { getEntityDeletion, putEntityDeletion } from "./deletions.repository";

// The caller includes every affected store in its atomic transaction.
export async function applyEntityDeletion(
  deletion: EntityDeletion,
): Promise<void> {
  const current = await getEntityDeletion(deletion.feature, deletion.id);
  const marker =
    current && current.revision > deletion.revision ? current : deletion;
  await putEntityDeletion(marker);
  if (marker.feature === "players") {
    const player = await getPlayerById(marker.id);
    if (player)
      await putPlayer({
        ...player,
        archivedAt: marker.deletedAt,
        revision: Math.max(player.revision, marker.revision),
        updatedAt: Math.max(player.updatedAt, marker.deletedAt),
      });
  } else if (marker.feature === "teams") {
    const team = await getTeamById(marker.id);
    if (team)
      await updateTeamRecord({
        ...team,
        archivedAt: marker.deletedAt,
        revision: Math.max(team.revision, marker.revision),
        updatedAt: Math.max(team.updatedAt, marker.deletedAt),
      });
  } else if (marker.feature === "matches") {
    await deleteMatchRecording(marker.id);
  } else {
    await deleteTeamPlayerRecord(marker.id);
  }
}
