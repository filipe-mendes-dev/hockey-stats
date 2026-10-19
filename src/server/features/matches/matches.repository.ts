import "server-only";
import { and, eq, inArray, lte } from "drizzle-orm";
import {
  matchPlayerSchema,
  matchSchema,
  matchSnapshotSchema,
} from "../../../domain/matches/match.schema";
import type { MatchSnapshot } from "../../../domain/matches/match.schema";
import { db } from "../../db/client.ts";
import type { DatabaseTransaction } from "../../db/client.ts";
import { matches, matchPlayers } from "../../db/matches_schema.ts";
import { teams } from "../../db/teams_schema.ts";
import { players } from "../../db/players_schema.ts";
import { teamPlayers } from "../../db/team_players_schema.ts";

export async function listMatchSnapshotsForOwner(
  ownerUserId: string,
  transaction: DatabaseTransaction | typeof db = db,
): Promise<MatchSnapshot[]> {
  const rows = await transaction
    .select({ match: matches, player: matchPlayers })
    .from(matches)
    .leftJoin(matchPlayers, eq(matchPlayers.matchId, matches.id))
    .where(eq(matches.ownerUserId, ownerUserId));
  const snapshots = new Map<string, MatchSnapshot>();
  for (const row of rows) {
    let snapshot = snapshots.get(row.match.id);
    if (!snapshot) {
      snapshot = {
        match: matchSchema.parse({
          ...row.match,
          scheduledDate: row.match.scheduledDate ?? undefined,
          startedAt: row.match.startedAt ?? undefined,
          clock: row.match.clock ?? undefined,
          completedAt: row.match.completedAt ?? undefined,
          venueRole: row.match.venueRole ?? undefined,
        }),
        players: [],
      };
      snapshots.set(row.match.id, snapshot);
    }
    if (row.player)
      snapshot.players.push(
        matchPlayerSchema.parse({
          ...row.player,
          jerseyNumber: row.player.jerseyNumber ?? undefined,
        }),
      );
  }
  return Array.from(snapshots.values(), (snapshot) =>
    matchSnapshotSchema.parse(snapshot),
  );
}
export async function hasOwnedMatchReferences(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  snapshot: MatchSnapshot,
): Promise<boolean> {
  const team = await transaction
    .select({ id: teams.id })
    .from(teams)
    .where(
      and(
        eq(teams.id, snapshot.match.teamId),
        eq(teams.ownerUserId, ownerUserId),
      ),
    );
  if (team.length !== 1) return false;
  if (snapshot.players.length === 0) return true;
  const assigned = await transaction
    .select({ id: players.id })
    .from(teamPlayers)
    .innerJoin(
      players,
      and(
        eq(players.id, teamPlayers.playerId),
        eq(players.ownerUserId, ownerUserId),
      ),
    )
    .where(
      and(
        eq(teamPlayers.teamId, snapshot.match.teamId),
        eq(teamPlayers.ownerUserId, ownerUserId),
        inArray(
          teamPlayers.playerId,
          snapshot.players.map((player) => player.playerId),
        ),
      ),
    );
  return assigned.length === snapshot.players.length;
}
export async function insertMatchSnapshot(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  snapshot: MatchSnapshot,
): Promise<boolean> {
  const match = snapshot.match;
  const inserted = await transaction
    .insert(matches)
    .values({
      ...match,
      ownerUserId,
      scheduledDate: match.scheduledDate ?? null,
      venueRole: match.venueRole ?? null,
      startedAt: match.startedAt ?? null,
      currentPeriod: match.currentPeriod,
      clock: match.clock ?? null,
      closedPeriods: match.closedPeriods,
      completedAt: match.completedAt ?? null,
    })
    .onConflictDoNothing()
    .returning({ id: matches.id });
  if (inserted.length !== 1) return false;
  if (snapshot.players.length === 0) return true;
  const selected = await transaction
    .insert(matchPlayers)
    .values(
      snapshot.players.map((player) => ({
        ...player,
        jerseyNumber: player.jerseyNumber ?? null,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: matchPlayers.id });
  return selected.length === snapshot.players.length;
}

export async function getMatchSnapshotForOwner(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  id: string,
): Promise<MatchSnapshot | null> {
  const [match] = await transaction
    .select()
    .from(matches)
    .where(and(eq(matches.id, id), eq(matches.ownerUserId, ownerUserId)));
  if (!match) return null;
  const selected = await transaction
    .select()
    .from(matchPlayers)
    .where(eq(matchPlayers.matchId, id));
  return matchSnapshotSchema.parse({
    match: {
      ...match,
      scheduledDate: match.scheduledDate ?? undefined,
      venueRole: match.venueRole ?? undefined,
      startedAt: match.startedAt ?? undefined,
      clock: match.clock ?? undefined,
      completedAt: match.completedAt ?? undefined,
    },
    players: selected.map((player) => ({
      ...player,
      jerseyNumber: player.jerseyNumber ?? undefined,
    })),
  });
}
export async function updateMatchSnapshot(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  snapshot: MatchSnapshot,
  expectedRevision: number,
): Promise<boolean> {
  const match = snapshot.match;
  const updated = await transaction
    .update(matches)
    .set({
      opponentName: match.opponentName,
      scheduledDate: match.scheduledDate ?? null,
      venueRole: match.venueRole ?? null,
      status: match.status,
      periods: match.periods,
      startedAt: match.startedAt ?? null,
      currentPeriod: match.currentPeriod,
      clock: match.clock ?? null,
      closedPeriods: match.closedPeriods,
      completedAt: match.completedAt ?? null,
      revision: match.revision,
      updatedAt: match.updatedAt,
    })
    .where(
      and(
        eq(matches.id, match.id),
        eq(matches.ownerUserId, ownerUserId),
        eq(matches.revision, expectedRevision),
        eq(matches.status, "setup"),
        eq(matches.createdAt, match.createdAt),
        eq(matches.teamId, match.teamId),
        eq(matches.teamNameAtMatch, match.teamNameAtMatch),
        lte(matches.updatedAt, match.updatedAt),
      ),
    )
    .returning({ id: matches.id });
  if (updated.length !== 1) return false;
  await transaction
    .delete(matchPlayers)
    .where(eq(matchPlayers.matchId, match.id));
  if (snapshot.players.length === 0) return true;
  const inserted = await transaction
    .insert(matchPlayers)
    .values(
      snapshot.players.map((player) => ({
        ...player,
        jerseyNumber: player.jerseyNumber ?? null,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: matchPlayers.id });
  return inserted.length === snapshot.players.length;
}

export async function updateMatchControl(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  match: MatchSnapshot["match"],
  expectedRevision: number,
): Promise<boolean> {
  const rows = await transaction
    .update(matches)
    .set({
      status: match.status,
      currentPeriod: match.currentPeriod,
      clock: match.clock ?? null,
      closedPeriods: match.closedPeriods,
      completedAt: match.completedAt ?? null,
      revision: match.revision,
      updatedAt: match.updatedAt,
    })
    .where(
      and(
        eq(matches.id, match.id),
        eq(matches.ownerUserId, ownerUserId),
        eq(matches.revision, expectedRevision),
        eq(matches.status, "live"),
      ),
    )
    .returning({ id: matches.id });
  return rows.length === 1;
}

export async function getOwnedMatchForUpdate(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  matchId: string,
) {
  const [row] = await transaction
    .select()
    .from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.ownerUserId, ownerUserId)))
    .for("update");
  return row
    ? matchSchema.parse({
        ...row,
        scheduledDate: row.scheduledDate ?? undefined,
        venueRole: row.venueRole ?? undefined,
        startedAt: row.startedAt ?? undefined,
        clock: row.clock ?? undefined,
        completedAt: row.completedAt ?? undefined,
      })
    : null;
}
