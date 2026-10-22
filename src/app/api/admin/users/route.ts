import { APIError } from "better-auth/api";
import {
  adminUserActionSchema,
  usersDirectoryQuerySchema,
} from "../../../../contracts/admin-users.schema";
import { getAuthEnvironment } from "../../../../server/environment";
import { AdminUsersError } from "../../../../server/features/admin/users.errors";
import {
  getUsersDirectory,
  manageUser,
} from "../../../../server/features/admin/users.service";
import { noStoreJson } from "../../../../server/features/sync/sync-http";

export const runtime = "nodejs";

function errorResponse(error: unknown): Response {
  if (error instanceof AdminUsersError)
    return noStoreJson({ code: error.code }, error.status);
  if (error instanceof APIError) {
    if (error.body?.code === "USERNAME_IS_ALREADY_TAKEN")
      return noStoreJson({ code: "username_taken" }, 409);
    if (error.statusCode === 429)
      return noStoreJson({ code: "rate_limited" }, 429);
    if (error.statusCode === 401)
      return noStoreJson({ code: "authentication_required" }, 401);
    if (error.statusCode === 403)
      return noStoreJson({ code: "forbidden" }, 403);
  }
  return noStoreJson({ code: "unavailable" }, 503);
}

export async function GET(request: Request): Promise<Response> {
  const parameters = new URL(request.url).searchParams;
  const query = usersDirectoryQuerySchema.safeParse({
    search: parameters.get("search") ?? "",
    page: parameters.get("page") ?? 1,
  });
  if (!query.success) return noStoreJson({ code: "invalid_input" }, 400);
  try {
    return noStoreJson(await getUsersDirectory(request.headers, query.data));
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  if (request.headers.get("origin") !== getAuthEnvironment().baseURL)
    return noStoreJson({ code: "forbidden" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return noStoreJson({ code: "invalid_input" }, 415);
  const body: unknown = await request.json().catch(() => null);
  const action = adminUserActionSchema.safeParse(body);
  if (!action.success) return noStoreJson({ code: "invalid_input" }, 400);
  try {
    await manageUser(request.headers, action.data);
    return noStoreJson({ success: true });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
