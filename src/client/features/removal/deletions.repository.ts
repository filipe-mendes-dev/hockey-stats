import { entityDeletionSchema } from "../../../contracts/entity-deletions.schema";
import type {
  EntityDeletion,
  DeletionFeature,
} from "../../../contracts/entity-deletions.schema";
import { getDatabase } from "../../storage/database";

export const deletionStores = [
  "metadata",
  "players",
  "teams",
  "teamPlayers",
  "matches",
  "matchPlayers",
  "matchEvents",
  "matchHistory",
  "entityDeletions",
  "outbox",
];

export async function getEntityDeletion(
  feature: DeletionFeature,
  id: string,
): Promise<EntityDeletion | null> {
  const database = await getDatabase();
  const row: unknown = await database
    .table<unknown, [string, string]>("entityDeletions")
    .get([feature, id]);
  return row === undefined ? null : entityDeletionSchema.parse(row);
}

export async function putEntityDeletion(
  deletion: EntityDeletion,
): Promise<void> {
  const database = await getDatabase();
  await database
    .table<EntityDeletion, [string, string]>("entityDeletions")
    .put(deletion);
}
