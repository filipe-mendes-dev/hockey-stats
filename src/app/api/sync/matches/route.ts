import { matchesDownloadSchema } from "../../../../contracts/matches-sync.schema";
import { listMatchSnapshotsForOwner } from "../../../../server/features/matches/matches.repository";
import {
  authenticateSync,
  noStoreJson,
} from "../../../../server/features/sync/sync-http";
export async function GET(request: Request): Promise<Response> {
  try {
    const owner = await authenticateSync(request);
    if (owner instanceof Response) return owner;
    return noStoreJson(
      matchesDownloadSchema.parse({
        version: 1,
        ownerUserId: owner,
        matches: await listMatchSnapshotsForOwner(owner),
      }),
    );
  } catch {
    return noStoreJson({ code: "unavailable" }, 503);
  }
}
