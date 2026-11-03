import { z } from "zod";
import {
  matchSharingRequestSchema,
  matchSharingStatusSchema,
} from "../../../../../contracts/match-sharing.schema";
import { getAuthEnvironment } from "../../../../../server/environment";
import {
  getMatchSharing,
  shareMatch,
  stopSharingMatch,
} from "../../../../../server/features/sharing/matchSharing.service";
import { MatchSharingError } from "../../../../../server/features/sharing/matchSharing.errors";
import {
  authenticateSync,
  noStoreJson,
} from "../../../../../server/features/sync/sync-http";

export const runtime = "nodejs";

async function handle(
  request: Request,
  context: RouteContext<"/api/matches/[id]/sharing">,
): Promise<Response> {
  try {
    const owner = await authenticateSync(request);
    if (owner instanceof Response) return owner;
    const { id } = await context.params;
    if (!z.uuidv4().safeParse(id).success)
      return noStoreJson({ code: "invalid_input" }, 400);
    if (
      request.method !== "GET" &&
      request.headers.get("origin") !== getAuthEnvironment().baseURL
    )
      return noStoreJson({ code: "forbidden" }, 403);
    if (request.method === "GET")
      return noStoreJson(
        matchSharingStatusSchema.parse(await getMatchSharing(owner, id)),
      );
    if (request.method === "DELETE")
      return noStoreJson(
        matchSharingStatusSchema.parse(await stopSharingMatch(owner, id)),
      );
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return noStoreJson({ code: "invalid_input" }, 415);
    const value: unknown = await request.json().catch(() => null);
    const input = matchSharingRequestSchema.safeParse(value);
    if (!input.success) return noStoreJson({ code: "invalid_input" }, 400);
    return noStoreJson(
      matchSharingStatusSchema.parse(
        await shareMatch(owner, id, input.data.expectedRevision),
      ),
    );
  } catch (error: unknown) {
    if (error instanceof MatchSharingError)
      return noStoreJson({ code: error.code }, error.status);
    return noStoreJson({ code: "unavailable" }, 503);
  }
}
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
