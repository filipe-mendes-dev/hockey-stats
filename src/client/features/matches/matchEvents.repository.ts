import { matchEventSchema } from "../../../domain/matches/matchEvent.schema";
import type { MatchEvent } from "../../../domain/matches/matchEvent.schema";
import { getDatabase } from "../../storage/database";
import { matchHistorySchema } from "./matchHistory.schema";
import type { MatchHistoryEntry } from "./matchHistory.schema";

export async function listMatchEvents(matchId: string): Promise<MatchEvent[]> {
  const database = await getDatabase();
  const rows = await database
    .table<unknown, string>("matchEvents")
    .where("matchId")
    .equals(matchId)
    .toArray();
  return rows
    .map((row) => matchEventSchema.parse(row))
    .sort((a, b) => a.order - b.order);
}
export async function getMatchEvent(id: string): Promise<MatchEvent | null> {
  const database = await getDatabase();
  const row = await database.table<unknown, string>("matchEvents").get(id);
  return row === undefined ? null : matchEventSchema.parse(row);
}
export async function getMatchHistoryEntry(
  id: string,
): Promise<MatchHistoryEntry | null> {
  const database = await getDatabase();
  const row = await database.table<unknown, string>("matchHistory").get(id);
  return row === undefined ? null : matchHistorySchema.parse(row);
}
export async function getLatestUndoEvent(
  matchId: string,
): Promise<MatchEvent | null> {
  const database = await getDatabase();
  return database.transaction(
    "r",
    ["matchEvents", "matchHistory"],
    async () => {
      const event = (await listMatchEvents(matchId))
        .filter((entry) => entry.deletedAt === undefined)
        .at(-1);
      if (!event) return null;
      const history = await getMatchHistoryEntry(event.id);
      return history && history.matchId === matchId && !history.undoneAt
        ? event
        : null;
    },
  );
}
export async function insertMatchEvent(event: MatchEvent): Promise<void> {
  const database = await getDatabase();
  await database.table<MatchEvent, string>("matchEvents").add(event);
}
export async function updateMatchEvent(event: MatchEvent): Promise<void> {
  const database = await getDatabase();
  await database.table<MatchEvent, string>("matchEvents").put(event);
}
export async function saveMatchHistoryEntry(
  entry: MatchHistoryEntry,
): Promise<void> {
  const database = await getDatabase();
  await database.table<MatchHistoryEntry, string>("matchHistory").put(entry);
}
export async function replaceMatchEvents(
  matchId: string,
  events: readonly MatchEvent[],
): Promise<void> {
  const database = await getDatabase();
  await database
    .table<MatchEvent, string>("matchEvents")
    .where("matchId")
    .equals(matchId)
    .delete();
  await database.table<MatchEvent, string>("matchEvents").bulkAdd([...events]);
}
