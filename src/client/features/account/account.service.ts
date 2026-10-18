import { authenticatedUserSchema } from "./account.schema";
import type { AuthenticatedUser } from "./account.schema";
import { authClient } from "../auth/auth-client";
import { getDatabase } from "../../storage/database";
import { notifyLocalDataChanged } from "../../storage/localDataEvents";
import { getLocalIdentity, insertLocalIdentity } from "./account.repository";
import { listStoredPlayers } from "../players/players.repository";
import { insertOutboxOperation } from "../sync/outbox.repository";
import { createPlayerCommandSchema } from "../../../contracts/players-sync.schema";

export interface LocalAccountSetupOptions {
  importExistingData: boolean;
}

export class AccountMismatchError extends Error {
  constructor() {
    super("The authenticated account does not own this local dataset.");
    this.name = "AccountMismatchError";
  }
}

export class LocalAccountRequiredError extends Error {
  constructor() {
    super("Local account setup is required.");
    this.name = "LocalAccountRequiredError";
  }
}

export async function getOnlineAccount(): Promise<AuthenticatedUser | null> {
  const result = await authClient.getSession({
    query: { disableCookieCache: true },
  });
  if (result.error) throw new Error("Could not verify the online session.");
  return result.data === null
    ? null
    : authenticatedUserSchema.parse(result.data.user);
}

export async function setUpLocalAccount(
  account: AuthenticatedUser,
  options: LocalAccountSetupOptions,
): Promise<void> {
  const authenticated = await getOnlineAccount();
  if (!authenticated || authenticated.id !== account.id)
    throw new AccountMismatchError();
  const database = await getDatabase();
  await database.transaction(
    "rw",
    ["metadata", "players", "outbox"],
    async () => {
      const current = await getLocalIdentity();
      if (current) {
        if (current.ownerUserId !== account.id)
          throw new AccountMismatchError();
        return;
      }
      const players = await listStoredPlayers();
      if (players.length > 0 && !options.importExistingData)
        throw new LocalAccountRequiredError();
      for (const player of players) {
        const command = createPlayerCommandSchema.parse({
          version: 1,
          kind: "player.create",
          operationId: crypto.randomUUID(),
          player,
        });
        await insertOutboxOperation({
          operationId: command.operationId,
          entityId: player.id,
          status: "pending",
          command,
        });
      }
      await insertLocalIdentity({
        key: "identity",
        ownerUserId: account.id,
        accountName: account.username ?? account.name,
      });
    },
  );
  notifyLocalDataChanged();
}
