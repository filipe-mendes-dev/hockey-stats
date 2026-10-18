import type { Player } from "../../../domain/players/player.schema";
import type { CreatePlayerInput } from "../../../domain/players/validation/createPlayer.schema";
import { getDatabase } from "../../storage/database";
import { notifyLocalDataChanged } from "../../storage/localDataEvents";
import { getLocalIdentity } from "../account/account.repository";
import { LocalAccountRequiredError } from "../account/account.service";
import { insertOutboxOperation } from "../sync/outbox.repository";
import { insertPlayer } from "./players.repository";

export async function createPlayer(input: CreatePlayerInput): Promise<Player> {
  const now = Date.now();
  const player: Player = {
    id: crypto.randomUUID(),
    name: input.name,
    revision: 1,
    createdAt: now,
    updatedAt: now,
  };
  const operationId = crypto.randomUUID();
  const database = await getDatabase();
  await database.transaction(
    "rw",
    ["metadata", "players", "outbox"],
    async () => {
      if (!(await getLocalIdentity())) throw new LocalAccountRequiredError();
      await insertPlayer(player);
      await insertOutboxOperation({
        operationId,
        playerId: player.id,
        status: "pending",
        command: { version: 1, operationId, kind: "player.create", player },
      });
    },
  );
  notifyLocalDataChanged();
  return player;
}
