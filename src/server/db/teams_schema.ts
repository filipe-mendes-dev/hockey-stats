import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { auth_user } from "./auth_schema.ts";

export const teams = pgTable(
  "team",
  {
    id: uuid("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => auth_user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category"),
    season: text("season"),
    revision: integer("revision").notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [index("team_owner_idx").on(table.ownerUserId)],
);
