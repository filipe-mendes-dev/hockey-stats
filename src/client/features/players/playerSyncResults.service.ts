import type { Player } from "../../../domain/players/player.schema";
import type { PlayerAcknowledgement } from "../../../contracts/players-sync.schema";
import { getDatabase } from "../../storage/database";
import { notifyLocalDataChanged } from "../../storage/localDataEvents";
import { getLocalIdentity } from "../account/account.repository";
import { AccountMismatchError } from "../account/account.service";
import { getPlayerById, putPlayer } from "./players.repository";
import {
  blockOutboxOperation,
  deleteOutboxOperation,
  getOutboxOperation,
  listOutboxOperations,
} from "../sync/outbox.repository";

async function requireOwner(
  expectedOwner: string,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  if ((await getLocalIdentity())?.ownerUserId !== expectedOwner)
    throw new AccountMismatchError();
  signal.throwIfAborted();
}

export async function acknowledgePlayer(
  expectedOwner: string,
  acknowledgement: PlayerAcknowledgement,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  if (acknowledgement.ownerUserId !== expectedOwner)
    throw new AccountMismatchError();
  const database = await getDatabase();
  await database.transaction(
    "rw",
    ["metadata", "players", "outbox"],
    async () => {
      await requireOwner(expectedOwner, signal);
      const operation = await getOutboxOperation(acknowledgement.operationId);
      if (!operation) return;
      if (operation.playerId !== acknowledgement.player.id)
        throw new Error("Acknowledgement refers to another player.");
      const current = await getPlayerById(operation.playerId);
      signal.throwIfAborted();
      if (!current || current.revision <= acknowledgement.player.revision)
        await putPlayer(acknowledgement.player);
      await deleteOutboxOperation(operation.operationId);
    },
  );
  notifyLocalDataChanged("sync");
}

export async function mergeDownloadedPlayers(
  expectedOwner: string,
  players: Player[],
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  const database = await getDatabase();
  await database.transaction(
    "rw",
    ["metadata", "players", "outbox"],
    async () => {
      await requireOwner(expectedOwner, signal);
      const pendingIds = new Set(
        (await listOutboxOperations()).map((entry) => entry.playerId),
      );
      for (const player of players) {
        signal.throwIfAborted();
        if (pendingIds.has(player.id)) continue;
        const current = await getPlayerById(player.id);
        if (!current || current.revision <= player.revision)
          await putPlayer(player);
      }
    },
  );
  notifyLocalDataChanged("sync");
}

export async function rejectPlayerOperation(
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
