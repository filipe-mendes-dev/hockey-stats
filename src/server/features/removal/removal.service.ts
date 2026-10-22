import "server-only";
import { getDeletionFeature } from "../../../contracts/entity-deletions.schema";
import type {
  DeleteEntityCommand,
  EntityDeletion,
} from "../../../contracts/entity-deletions.schema";
import type { DatabaseTransaction } from "../../db/client.ts";
import { SyncConflictError } from "../sync/sync.errors";
import { insertDeletion } from "./deletions.repository";
import {
  getOwnedRemovalTarget,
  listOwnedRemovalMemberships,
  archiveOwnedRecord,
  deleteOwnedMembership,
  deleteOwnedMatch,
} from "./removal.repository";

export async function applyDeletionCommand(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  command: DeleteEntityCommand,
): Promise<EntityDeletion[]> {
  const feature = getDeletionFeature(command);
  const current = await getOwnedRemovalTarget(
    transaction,
    ownerUserId,
    feature,
    command.id,
  );
  if (
    !current ||
    current.revision !== command.expectedRevision ||
    command.deletedAt < current.updatedAt
  )
    throw new SyncConflictError("revision_conflict");
  const primary: EntityDeletion = {
    feature,
    id: command.id,
    revision: command.expectedRevision + 1,
    deletedAt: command.deletedAt,
  };
  const deletions: EntityDeletion[] = [primary];
  if (feature === "players" || feature === "teams") {
    const memberships = await listOwnedRemovalMemberships(
      transaction,
      ownerUserId,
      feature,
      command.id,
    );
    for (const member of memberships) {
      const deletion: EntityDeletion = {
        feature: "teamPlayers",
        id: member.id,
        revision: member.revision + 1,
        deletedAt: command.deletedAt,
      };
      await insertDeletion(transaction, ownerUserId, deletion);
      await deleteOwnedMembership(transaction, ownerUserId, member.id);
      deletions.push(deletion);
    }
    await archiveOwnedRecord(
      transaction,
      ownerUserId,
      feature,
      command.id,
      primary.revision,
      command.deletedAt,
    );
  } else if (feature === "matches") {
    await deleteOwnedMatch(transaction, ownerUserId, command.id);
  } else {
    await deleteOwnedMembership(transaction, ownerUserId, command.id);
  }
  await insertDeletion(transaction, ownerUserId, primary);
  return deletions;
}
