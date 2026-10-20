import { getAuthEnvironment } from "../../../../server/environment";
import { syncCommandSchema } from "../../../../contracts/sync.schema";
import {
  acceptSyncCommand,
  SyncConflictError,
} from "../../../../server/features/sync/commands.service";
import {
  authenticateSync,
  noStoreJson,
} from "../../../../server/features/sync/sync-http";

export async function POST(request: Request): Promise<Response> {
  // A cross-origin form must not mutate records using the browser's session cookie.
  const origin = request.headers.get("origin");
  if (origin !== getAuthEnvironment().baseURL)
    return noStoreJson({ code: "invalid_command" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return noStoreJson({ code: "invalid_command" }, 415);
  try {
    const owner = await authenticateSync(request);
    if (owner instanceof Response) return owner;
    const body: unknown = await request.json().catch(() => null);
    const command = syncCommandSchema.safeParse(body);
    if (!command.success) return noStoreJson({ code: "invalid_command" }, 400);
    return noStoreJson(await acceptSyncCommand(owner, command.data));
  } catch (error: unknown) {
    if (error instanceof SyncConflictError)
      return noStoreJson({ code: error.code }, 409);
    return noStoreJson({ code: "unavailable" }, 503);
  }
}
