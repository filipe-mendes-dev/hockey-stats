import "server-only";
import { getSession } from "../../auth/session";

export function syncJson(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function authenticateSync(
  request: Request,
): Promise<string | Response> {
  const session = await getSession();
  if (!session || session.user.banned)
    return syncJson({ code: "authentication_required" }, 401);
  if (request.headers.get("X-Expected-User-Id") !== session.user.id)
    return syncJson({ code: "account_mismatch" }, 403);
  return session.user.id;
}
