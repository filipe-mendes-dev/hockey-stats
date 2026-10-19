import {
  bigint,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { matches, matchPlayers } from "./matches_schema.ts";
export const matchEvents = pgTable(
  "match_event",
  {
    id: uuid("id").primaryKey(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    matchPlayerId: uuid("match_player_id")
      .notNull()
      .references(() => matchPlayers.id, { onDelete: "restrict" }),
    order: integer("event_order").notNull(),
    kind: text("kind").notNull(),
    subtype: text("subtype").notNull(),
    period: integer("period").notNull(),
    gameTimeMs: bigint("game_time_ms", { mode: "number" }),
    positionX: doublePrecision("position_x"),
    positionY: doublePrecision("position_y"),
    capturedAt: bigint("captured_at", { mode: "number" }).notNull(),
    revision: integer("revision").notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
  },
  (table) => [
    unique("match_event_order_unique").on(table.matchId, table.order),
    index("match_event_match_idx").on(table.matchId),
  ],
);
