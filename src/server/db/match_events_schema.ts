import {
  bigint,
  boolean,
  foreignKey,
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
    matchPlayerId: uuid("match_player_id").references(() => matchPlayers.id, {
      onDelete: "restrict",
    }),
    outgoingMatchPlayerId: uuid("outgoing_match_player_id").references(
      () => matchPlayers.id,
      { onDelete: "restrict" },
    ),
    incomingMatchPlayerId: uuid("incoming_match_player_id").references(
      () => matchPlayers.id,
      { onDelete: "restrict" },
    ),
    replacementMatchPlayerId: uuid("replacement_match_player_id").references(
      () => matchPlayers.id,
      { onDelete: "restrict" },
    ),
    lineupEffect: text("lineup_effect"),
    startsPowerplay: boolean("starts_powerplay"),
    powerplayDurationMs: integer("powerplay_duration_ms"),
    removedMatchPlayerId: uuid("removed_match_player_id").references(
      () => matchPlayers.id,
      { onDelete: "restrict" },
    ),
    powerplayCardEventId: uuid("powerplay_card_event_id"),
    entryReason: text("entry_reason"),
    order: integer("event_order").notNull(),
    kind: text("kind").notNull(),
    subtype: text("subtype"),
    reason: text("reason"),
    rinkHalf: text("rink_half", { enum: ["defensive", "attacking"] }),
    outcome: text("outcome"),
    colour: text("colour"),
    ownDelta: integer("own_delta"),
    opponentDelta: integer("opponent_delta"),
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
    foreignKey({
      name: "match_event_powerplay_card_fk",
      columns: [table.powerplayCardEventId],
      foreignColumns: [table.id],
    }).onDelete("restrict"),
  ],
);
