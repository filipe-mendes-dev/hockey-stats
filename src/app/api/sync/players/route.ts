import { playersDownloadSchema } from "../../../../contracts/players-sync.schema";
import { listPlayersForOwner } from "../../../../server/features/players/players.repository";
import {
  authenticateSync,
  noStoreJson,
} from "../../../../server/features/sync/sync-http";

export async function GET(request: Request): Promise<Response> {
  try {
    const owner = await authenticateSync(request);
    if (owner instanceof Response) return owner;
    const players = await listPlayersForOwner(owner);
    return noStoreJson(
      playersDownloadSchema.parse({ version: 1, ownerUserId: owner, players }),
    );
  } catch {
    return noStoreJson({ code: "unavailable" }, 503);
  }
}
