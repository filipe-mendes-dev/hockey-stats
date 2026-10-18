import { localIdentitySchema } from "./account.schema";
import type { LocalIdentity } from "./account.schema";
import { getDatabase } from "../../storage/database";

export async function getLocalIdentity(): Promise<LocalIdentity | null> {
  const database = await getDatabase();
  const record: unknown = await database
    .table<unknown, string>("metadata")
    .get("identity");
  return record === undefined ? null : localIdentitySchema.parse(record);
}

export async function insertLocalIdentity(
  identity: LocalIdentity,
): Promise<void> {
  const database = await getDatabase();
  await database.table<LocalIdentity, string>("metadata").add(identity);
}
