import { Dexie } from "dexie";
import { playerSchema } from "../../domain/players/player.schema";
import { teamPlayerSchema } from "../../domain/teams/teamPlayer.schema";
import {
  outboxOperationSchema,
  migrateLegacyOutboxOperation,
} from "../features/sync/outbox.schema";
import { requestStoragePersistence } from "./persistence";
import type { StoragePersistence } from "./persistence";

export interface DatabaseStatus {
  status:
    "preparing" | "ready" | "blocked" | "closed" | "unsupported" | "failed";
  persistence: StoragePersistence | null;
}

export const localDataClearedEvent = "benchline.local-data-cleared";
const databaseName = "benchline-stats";
const initialStatus: DatabaseStatus = {
  status: "preparing",
  persistence: null,
};
let snapshot = initialStatus;
let database: Dexie | undefined;
let opening: Promise<Dexie> | undefined;
let signingOut = false;
const listeners = new Set<() => void>();

function setStatus(
  status: DatabaseStatus["status"],
  persistence: StoragePersistence | null = null,
): void {
  snapshot = { status, persistence };
  listeners.forEach((listener) => listener());
}

export function getDatabaseStatus(): DatabaseStatus {
  return snapshot;
}

export function getServerDatabaseStatus(): DatabaseStatus {
  return initialStatus;
}

export function subscribeDatabaseStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function openDatabase(): Promise<Dexie> {
  setStatus("preparing");
  if (!("indexedDB" in window) || !window.indexedDB) {
    setStatus("unsupported");
    throw new Error("IndexedDB is unavailable.");
  }

  const connection = new Dexie(databaseName, {
    autoOpen: false,
    chromeTransactionDurability: "strict",
  });
  database = connection;
  connection.version(1).stores({ metadata: "key" });
  connection.version(2).stores({ players: "id, workspaceId" });
  connection
    .version(3)
    .stores({ metadata: null, players: "id" })
    .upgrade(async (transaction) => {
      const players = transaction.table<unknown, string>("players");
      const records = await players.toArray();
      for (const record of records) {
        await players.put(playerSchema.parse(record));
      }
    });

  connection.version(4).stores({
    metadata: "key",
    outbox: "++sequence, &operationId, playerId, status",
  });

  connection
    .version(5)
    .stores({
      teams: "id",
      outbox: "++sequence, &operationId, entityId, status",
    })
    .upgrade(async (transaction) => {
      const outbox = transaction.table<unknown, number>("outbox");
      for (const record of await outbox.toArray()) {
        await outbox.put(migrateLegacyOutboxOperation(record));
      }
    });

  connection
    .version(6)
    .stores({ teamPlayers: "id, &[teamId+playerId], teamId, playerId" });

  connection
    .version(7)
    .stores({})
    .upgrade(async (transaction) => {
      const teamPlayers = transaction.table<unknown, string>("teamPlayers");
      for (const record of await teamPlayers.toArray()) {
        await teamPlayers.put(teamPlayerSchema.parse(record));
      }
      const outbox = transaction.table<unknown, number>("outbox");
      for (const record of await outbox.toArray()) {
        const operation = outboxOperationSchema.parse(record);
        if (
          operation.command.kind === "teamPlayer.create" ||
          operation.command.kind === "teamPlayer.update"
        ) {
          await outbox.put(operation);
        }
      }
    });

  connection.version(8).stores({
    matches: "id",
    matchPlayers: "id, matchId, &[matchId+playerId]",
  });

  connection.version(9).stores({
    matchEvents: "id, matchId, &[matchId+order]",
    matchHistory: "id, matchId",
  });

  connection.version(10).stores({ entityDeletions: "&[feature+id],feature" });

  connection.on("blocked", () => setStatus("blocked"));
  connection.on("versionchange", (event) => {
    opening = undefined;
    setStatus("closed");
    connection.close();
    if (event.newVersion === null) {
      signingOut = true;
      window.dispatchEvent(new Event(localDataClearedEvent));
    }
  });
  connection.on("close", () => {
    if (snapshot.status === "ready") {
      opening = undefined;
      setStatus("closed");
    }
  });

  await connection.open();
  if (signingOut) {
    connection.close();
    throw new Error("Local data is being removed.");
  }
  await connection.transaction("rw", "players", () =>
    connection.table<unknown, string>("players").count(),
  );
  const persistence = await requestStoragePersistence();
  if (signingOut || !connection.isOpen())
    throw new Error("Local storage is closed.");
  setStatus("ready", persistence);
  return connection;
}

export function getDatabase(): Promise<Dexie> {
  if (signingOut)
    return Promise.reject(new Error("Local data is being removed."));
  if (database?.isOpen() && snapshot.status === "ready")
    return Promise.resolve(database);
  opening ??= openDatabase().catch((error: unknown) => {
    if (snapshot.status !== "unsupported" && snapshot.status !== "closed")
      setStatus("failed");
    database?.close();
    opening = undefined;
    throw error;
  });
  return opening;
}

export function closeDatabaseForSignOut(): void {
  signingOut = true;
  database?.close();
  setStatus("closed");
}

export async function clearLocalDatabase(): Promise<void> {
  closeDatabaseForSignOut();
  try {
    localStorage.setItem(localDataClearedEvent, crypto.randomUUID());
  } catch {
    // Open connections also receive the IndexedDB versionchange event.
  }
  await opening?.catch(() => undefined);
  database?.close();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Close other application tabs to remove local data."));
  });
  database = undefined;
  opening = undefined;
}
