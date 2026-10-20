import { teamsDownloadSchema } from "../../../../contracts/teams-sync.schema";
import { listTeamsForOwner } from "../../../../server/features/teams/teams.repository";
import {
  authenticateSync,
  noStoreJson,
} from "../../../../server/features/sync/sync-http";

export async function GET(request: Request): Promise<Response> {
  try {
    const owner = await authenticateSync(request);
    if (owner instanceof Response) return owner;
    const teams = await listTeamsForOwner(owner);
    return noStoreJson(
      teamsDownloadSchema.parse({ version: 1, ownerUserId: owner, teams }),
    );
  } catch {
    return noStoreJson({ code: "unavailable" }, 503);
  }
}
