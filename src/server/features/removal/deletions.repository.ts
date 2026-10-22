import "server-only";
import { and, eq } from "drizzle-orm";
import { entityDeletionSchema } from "../../../contracts/entity-deletions.schema";
import type {
  EntityDeletion,
  DeletionFeature,
} from "../../../contracts/entity-deletions.schema";
import { db } from "../../db/client.ts";
import type { DatabaseTransaction } from "../../db/client.ts";
import { entityDeletions } from "../../db/entity_deletions_schema.ts";

export async function listDeletionsForOwner(
  ownerUserId: string,
): Promise<EntityDeletion[]> {
  const rows = await db
    .select()
    .from(entityDeletions)
    .where(eq(entityDeletions.ownerUserId, ownerUserId));
  return rows.map((row) => entityDeletionSchema.parse(row));
}
export async function getOwnedDeletion(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  feature: DeletionFeature,
  id: string,
): Promise<EntityDeletion | null> {
  const [row] = await transaction
    .select()
    .from(entityDeletions)
    .where(
      and(
        eq(entityDeletions.ownerUserId, ownerUserId),
        eq(entityDeletions.feature, feature),
        eq(entityDeletions.id, id),
      ),
    );
  return row ? entityDeletionSchema.parse(row) : null;
}
export async function insertDeletion(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  deletion: EntityDeletion,
): Promise<void> {
  await transaction
    .insert(entityDeletions)
    .values({ ...deletion, ownerUserId })
    .onConflictDoNothing();
}
