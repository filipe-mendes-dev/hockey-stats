import { getAuthEnvironment } from "../../../../server/environment";
import { createPlayerCommandSchema } from "../../../../contracts/players-sync.schema";
import {
  acceptPlayerCreation,
  SyncConflictError,
} from "../../../../server/features/players/playerCommands.service";
import {
  authenticateSync,
  syncJson,
} from "../../../../server/features/sync/sync-http";

export async function POST(request: Request): Promise<Response> {
  // A cross-origin form must not mutate records using the browser's session cookie.
  const origin = request.headers.get("origin");
  if (origin !== getAuthEnvironment().baseURL)
    return syncJson({ code: "invalid_command" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return syncJson({ code: "invalid_command" }, 415);
  try {
    const owner = await authenticateSync(request);
    if (owner instanceof Response) return owner;
    const body: unknown = await request.json().catch(() => null);
    const command = createPlayerCommandSchema.safeParse(body);
    if (!command.success) return syncJson({ code: "invalid_command" }, 400);
    return syncJson(await acceptPlayerCreation(owner, command.data));
  } catch (error: unknown) {
    if (error instanceof SyncConflictError)
      return syncJson({ code: error.code }, 409);
    return syncJson({ code: "unavailable" }, 503);
  }
}
