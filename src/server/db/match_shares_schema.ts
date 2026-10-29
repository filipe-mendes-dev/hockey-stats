import { bigint, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { matches } from "./matches_schema.ts";

export const matchShares = pgTable("match_share", {
  matchId: uuid("match_id")
    .primaryKey()
    .references(() => matches.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
