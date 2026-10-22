import type { Player } from "../../../domain/players/player.schema";
import type { CreatePlayerInput } from "../../../domain/players/validation/createPlayer.schema";
import { getDatabase } from "../../storage/database";
import { notifyLocalDataChanged } from "../../storage/localDataEvents";
import { getLocalIdentity } from "../account/account.repository";
import { LocalAccountRequiredError } from "../account/account.service";
import { insertOutboxOperation } from "../sync/outbox.repository";
import {
  insertPlayer,
  getPlayerById,
  updatePlayerRecord,
} from "./players.repository";
import { updatePlayerInputSchema } from "../../../domain/players/validation/updatePlayer.schema";
import type { UpdatePlayerInput } from "../../../domain/players/validation/updatePlayer.schema";
import { PlayerChangedError } from "./players.errors";

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
        entityId: player.id,
        status: "pending",
        command: { version: 1, operationId, kind: "player.create", player },
      });
    },
  );
  notifyLocalDataChanged("write", "players");
  return player;
}

export async function updatePlayer(input: UpdatePlayerInput): Promise<Player> {
  const fields = updatePlayerInputSchema.parse(input);
  const database = await getDatabase();
  const result = await database.transaction(
    "rw",
    ["metadata", "players", "outbox"],
    async () => {
      if (!(await getLocalIdentity())) throw new LocalAccountRequiredError();
      const current = await getPlayerById(fields.id);
      if (
        !current ||
        current.archivedAt ||
        current.revision !== fields.expectedRevision
      )
        throw new PlayerChangedError();
      const player: Player = {
        ...current,
        name: fields.name,
        revision: current.revision + 1,
        updatedAt: Math.max(Date.now(), current.updatedAt),
      };
      const operationId = crypto.randomUUID();
      await updatePlayerRecord(player);
      await insertOutboxOperation({
        operationId,
        entityId: player.id,
        status: "pending",
        command: {
          version: 1,
          operationId,
          kind: "player.update",
          expectedRevision: current.revision,
          player,
        },
      });
      return player;
    },
  );
  notifyLocalDataChanged("write", "players");
  return result;
}
