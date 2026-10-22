import { deletionsDownloadSchema } from "../../../../contracts/entity-deletions.schema";
import { listDeletionsForOwner } from "../../../../server/features/removal/deletions.repository";
import {
  authenticateSync,
  noStoreJson,
} from "../../../../server/features/sync/sync-http";

export async function GET(request: Request): Promise<Response> {
  try {
    const owner = await authenticateSync(request);
    if (owner instanceof Response) return owner;
    return noStoreJson(
      deletionsDownloadSchema.parse({
        version: 1,
        ownerUserId: owner,
        deletions: await listDeletionsForOwner(owner),
      }),
    );
  } catch {
    return noStoreJson({ code: "unavailable" }, 503);
  }
}
