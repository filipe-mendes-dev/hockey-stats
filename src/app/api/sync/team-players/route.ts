import { teamPlayersDownloadSchema } from "../../../../contracts/teams-sync.schema";
import { listTeamPlayersForOwner } from "../../../../server/features/teams/teamPlayers.repository";
import {
  authenticateSync,
  noStoreJson,
} from "../../../../server/features/sync/sync-http";
export async function GET(request: Request): Promise<Response> {
  try {
    const owner = await authenticateSync(request);
    if (owner instanceof Response) return owner;
    return noStoreJson(
      teamPlayersDownloadSchema.parse({
        version: 1,
        ownerUserId: owner,
        teamPlayers: await listTeamPlayersForOwner(owner),
      }),
    );
  } catch {
    return noStoreJson({ code: "unavailable" }, 503);
  }
}
