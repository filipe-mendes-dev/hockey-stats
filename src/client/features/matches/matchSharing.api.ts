import { z } from "zod";
import {
  matchSharingErrorCodeSchema,
  matchSharingStatusSchema,
} from "../../../contracts/match-sharing.schema";
import type { MatchSharingErrorCode } from "../../../contracts/match-sharing.schema";
import { getLocalIdentity } from "../account/account.repository";
import { listOutboxOperations } from "../sync/outbox.repository";
import { getMatchSnapshot } from "./matches.repository";

export class MatchSharingRequestError extends Error {
  constructor(public readonly code: MatchSharingErrorCode) {
    super(code);
    this.name = "MatchSharingRequestError";
  }
}

export async function requestMatchSharing(
  matchId: string,
  method: "GET" | "POST" | "DELETE",
  signal: AbortSignal,
) {
  const identity = await getLocalIdentity();
  if (!identity) throw new MatchSharingRequestError("authentication_required");
  let expectedRevision: number | undefined;
  if (method === "POST") {
    const snapshot = await getMatchSnapshot(matchId);
    const operations = await listOutboxOperations();
    if (!snapshot || snapshot.match.status !== "completed")
      throw new MatchSharingRequestError("match_not_completed");
    if (operations.some((operation) => operation.entityId === matchId))
      throw new MatchSharingRequestError("sync_required");
    expectedRevision = snapshot.match.revision;
  }
  const response = await fetch(
    `/api/matches/${encodeURIComponent(matchId)}/sharing`,
    {
      method,
      cache: "no-store",
      credentials: "same-origin",
      headers: {
        "X-Expected-User-Id": identity.ownerUserId,
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      ...(method === "POST"
        ? { body: JSON.stringify({ expectedRevision }) }
        : {}),
      signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
    },
  );
  const value: unknown = await response.json().catch(() => null);
  signal.throwIfAborted();
  if ((await getLocalIdentity())?.ownerUserId !== identity.ownerUserId)
    throw new MatchSharingRequestError("account_mismatch");
  if (!response.ok) {
    const error = z
      .object({ code: matchSharingErrorCodeSchema })
      .safeParse(value);
    throw new MatchSharingRequestError(
      error.success ? error.data.code : "unavailable",
    );
  }
  if (method === "POST") {
    const current = await getMatchSnapshot(matchId);
    const operations = await listOutboxOperations();
    if (
      current?.match.revision !== expectedRevision ||
      operations.some((operation) => operation.entityId === matchId)
    )
      throw new MatchSharingRequestError("sync_required");
  }
  return matchSharingStatusSchema.parse(value);
}
