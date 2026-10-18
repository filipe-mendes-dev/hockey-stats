import type {
  SyncAcknowledgement,
  SyncDownload,
} from "../../../contracts/sync.schema";
import { playerSchema } from "../../../domain/players/player.schema";
import { teamSchema } from "../../../domain/teams/team.schema";
import { getDatabase } from "../../storage/database";
import { notifyLocalDataChanged } from "../../storage/localDataEvents";
import { getLocalIdentity } from "../account/account.repository";
import { AccountMismatchError } from "../account/account.service";
import {
  blockOutboxOperation,
  deleteOutboxOperation,
  getOutboxOperation,
  listOutboxOperations,
} from "./outbox.repository";

async function requireOwner(
  expectedOwner: string,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  if ((await getLocalIdentity())?.ownerUserId !== expectedOwner)
    throw new AccountMismatchError();
  signal.throwIfAborted();
}

export async function acknowledgeOperation(
  expectedOwner: string,
  acknowledgement: SyncAcknowledgement,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  if (acknowledgement.ownerUserId !== expectedOwner)
    throw new AccountMismatchError();
  const isPlayer = "player" in acknowledgement;
  const feature = isPlayer ? "players" : "teams";
  const entity = isPlayer ? acknowledgement.player : acknowledgement.team;
  const kind = isPlayer ? "player.create" : "team.create";
  const schema = isPlayer ? playerSchema : teamSchema;
  const database = await getDatabase();
  await database.transaction(
    "rw",
    ["metadata", feature, "outbox"],
    async () => {
      await requireOwner(expectedOwner, signal);
      const operation = await getOutboxOperation(acknowledgement.operationId);
      if (!operation) return;
      if (operation.entityId !== entity.id || operation.command.kind !== kind)
        throw new Error("Acknowledgement refers to another entity.");
      const table = database.table<unknown, string>(feature);
      const row = await table.get(entity.id);
      const current = row === undefined ? null : schema.parse(row);
      signal.throwIfAborted();
      if (!current || current.revision <= entity.revision)
        await table.put(entity);
      await deleteOutboxOperation(operation.operationId);
    },
  );
  notifyLocalDataChanged("sync", feature);
}

export async function mergeDownloadedEntities(
  expectedOwner: string,
  download: SyncDownload,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  if (download.ownerUserId !== expectedOwner) throw new AccountMismatchError();
  const isPlayers = "players" in download;
  const feature = isPlayers ? "players" : "teams";
  const kind = isPlayers ? "player.create" : "team.create";
  const records = isPlayers ? download.players : download.teams;
  const schema = isPlayers ? playerSchema : teamSchema;
  const database = await getDatabase();
  await database.transaction(
    "rw",
    ["metadata", feature, "outbox"],
    async () => {
      await requireOwner(expectedOwner, signal);
      const pendingIds = new Set(
        (await listOutboxOperations())
          .filter((entry) => entry.command.kind === kind)
          .map((entry) => entry.entityId),
      );
      const table = database.table<unknown, string>(feature);
      for (const entity of records) {
        signal.throwIfAborted();
        if (pendingIds.has(entity.id)) continue;
        const row = await table.get(entity.id);
        const current = row === undefined ? null : schema.parse(row);
        if (!current || current.revision <= entity.revision)
          await table.put(entity);
      }
    },
  );
  notifyLocalDataChanged("sync", feature);
}

export async function rejectOperation(
  expectedOwner: string,
  operationId: string,
  code: string,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  const database = await getDatabase();
  await database.transaction("rw", ["metadata", "outbox"], async () => {
    await requireOwner(expectedOwner, signal);
    await blockOutboxOperation(operationId, code);
  });
  notifyLocalDataChanged("sync");
}
