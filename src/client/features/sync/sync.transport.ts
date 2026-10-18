import { syncErrorSchema } from "../../../contracts/sync.schema";

export class SyncRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly retryAfterMs: number = 0,
  ) {
    super(code);
    this.name = "SyncRequestError";
  }
}

export async function syncRequest(
  path: string,
  owner: string,
  signal: AbortSignal,
  body?: string,
): Promise<unknown> {
  const controller = new AbortController();
  function abort(): void {
    controller.abort();
  }
  signal.throwIfAborted();
  signal.addEventListener("abort", abort, { once: true });
  const timeout = window.setTimeout(abort, 15_000);
  try {
    const response = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      body: body ?? null,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "X-Expected-User-Id": owner,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      signal: controller.signal,
    });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const error = syncErrorSchema.safeParse(data);
      const retryAfter = response.headers.get("Retry-After");
      const seconds = retryAfter === null ? 0 : Number(retryAfter);
      const retryAfterMs = Number.isFinite(seconds)
        ? Math.max(0, seconds * 1000)
        : Math.max(0, Date.parse(retryAfter ?? "") - Date.now());
      throw new SyncRequestError(
        response.status,
        error.success ? error.data.code : "unavailable",
        Number.isFinite(retryAfterMs) ? retryAfterMs : 0,
      );
    }
    return data;
  } finally {
    window.clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}
