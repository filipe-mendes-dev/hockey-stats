import { matchesDownloadSchema } from "../../../../contracts/matches-sync.schema";
import { listMatchRecordingsForOwner } from "../../../../server/features/matches/matchEvents.service";
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
        matches: await listMatchRecordingsForOwner(owner),
      }),
    );
  } catch {
    return noStoreJson({ code: "unavailable" }, 503);
  }
}
