import {
  matchSchema,
  matchSnapshotSchema,
} from "../../../domain/matches/match.schema";
import type {
  Match,
  MatchPlayer,
  MatchSnapshot,
} from "../../../domain/matches/match.schema";
import { getDatabase } from "../../storage/database";

export async function listMatchSnapshots(): Promise<MatchSnapshot[]> {
  const database = await getDatabase();
  return database.transaction("r", ["matches", "matchPlayers"], async () => {
    const matches = await database.table<unknown, string>("matches").toArray();
    const players = await database
      .table<unknown, string>("matchPlayers")
      .toArray();
    return matches.map((row) => {
      const match = matchSchema.parse(row);
      return matchSnapshotSchema.parse({
        match,
        players: players.filter(
          (player) =>
            typeof player === "object" &&
            player !== null &&
            "matchId" in player &&
            player.matchId === match.id,
        ),
      });
    });
  });
}
export async function getMatchSnapshot(
  id: string,
): Promise<MatchSnapshot | null> {
  if (!matchSchema.shape.id.safeParse(id).success) return null;
  const database = await getDatabase();
  return database.transaction("r", ["matches", "matchPlayers"], async () => {
    const match = await database.table<unknown, string>("matches").get(id);
    if (match === undefined) return null;
    const players = await database
      .table<unknown, string>("matchPlayers")
      .where("matchId")
      .equals(id)
      .toArray();
    return matchSnapshotSchema.parse({ match, players });
  });
}
export async function insertMatchSnapshot(
  snapshot: MatchSnapshot,
): Promise<void> {
  const database = await getDatabase();
  await database.table<Match, string>("matches").add(snapshot.match);
  await database
    .table<MatchPlayer, string>("matchPlayers")
    .bulkAdd(snapshot.players);
}
export async function replaceMatchSnapshot(
  snapshot: MatchSnapshot,
): Promise<void> {
  const database = await getDatabase();
  await database.table<Match, string>("matches").put(snapshot.match);
  await database
    .table<MatchPlayer, string>("matchPlayers")
    .where("matchId")
    .equals(snapshot.match.id)
    .delete();
  await database
    .table<MatchPlayer, string>("matchPlayers")
    .bulkAdd(snapshot.players);
}
