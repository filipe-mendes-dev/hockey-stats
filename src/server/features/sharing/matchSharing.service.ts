import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "../../db/client.ts";
import type { DatabaseTransaction } from "../../db/client.ts";
import { getAuthEnvironment } from "../../environment";
import {
  getOwnedMatchForUpdate,
  getMatchSnapshotForOwner,
} from "../matches/matches.repository";
import { listMatchEvents } from "../matches/matchEvents.repository";
import {
  getMatchShare,
  getSharedMatchReference,
  insertMatchShare,
  deleteMatchShare,
} from "./matchShares.repository";
import { MatchSharingError } from "./matchSharing.errors";
import { shareTokenSchema } from "../../../contracts/match-sharing.schema";
import { createMatchStatisticsView } from "../../../domain/matches/matchStatisticsView";

async function requireOwnedCompletedMatch(
  transaction: DatabaseTransaction,
  owner: string,
  id: string,
) {
  const match = await getOwnedMatchForUpdate(transaction, owner, id);
  if (!match) throw new MatchSharingError("match_unavailable", 404);
  if (match.status !== "completed")
    throw new MatchSharingError("match_not_completed", 409);
  return match;
}

function link(token: string | null) {
  return {
    url: token
      ? new URL(`/share/${token}`, getAuthEnvironment().baseURL).href
      : null,
  };
}

export async function getMatchSharing(owner: string, id: string) {
  return db.transaction(async (transaction) => {
    await requireOwnedCompletedMatch(transaction, owner, id);
    return link(await getMatchShare(transaction, id));
  });
}

export async function getSharedMatchStatistics(token: string) {
  if (!shareTokenSchema.safeParse(token).success) return null;
  return db.transaction(
    async (transaction) => {
      const reference = await getSharedMatchReference(transaction, token);
      if (!reference) return null;
      const snapshot = await getMatchSnapshotForOwner(
        transaction,
        reference.ownerUserId,
        reference.matchId,
      );
      if (!snapshot || snapshot.match.status !== "completed") return null;
      const events = await listMatchEvents(transaction, reference.matchId);
      return createMatchStatisticsView(
        snapshot,
        events,
        reference.category ?? undefined,
      );
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}

export async function shareMatch(
  owner: string,
  id: string,
  expectedRevision: number,
) {
  return db.transaction(async (transaction) => {
    const match = await requireOwnedCompletedMatch(transaction, owner, id);
    if (match.revision !== expectedRevision)
      throw new MatchSharingError("revision_conflict", 409);
    let token = await getMatchShare(transaction, id);
    if (!token) {
      token = randomBytes(32).toString("base64url");
      await insertMatchShare(transaction, id, token, Date.now());
    }
    return link(token);
  });
}

export async function stopSharingMatch(owner: string, id: string) {
  return db.transaction(async (transaction) => {
    await requireOwnedCompletedMatch(transaction, owner, id);
    await deleteMatchShare(transaction, id);
    return link(null);
  });
}
