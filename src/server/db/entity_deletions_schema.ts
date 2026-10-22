import {
  bigint,
  integer,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { auth_user } from "./auth_schema.ts";

export const entityDeletions = pgTable(
  "entity_deletion",
  {
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => auth_user.id, { onDelete: "cascade" }),
    feature: text("feature").notNull(),
    id: uuid("id").notNull(),
    revision: integer("revision").notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ownerUserId, table.feature, table.id] }),
  ],
);
