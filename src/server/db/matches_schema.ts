import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { Match } from "../../domain/matches/match.schema.ts";
import { auth_user } from "./auth_schema.ts";
import { teams } from "./teams_schema.ts";
import { players } from "./players_schema.ts";
import { teamPlayerRole } from "./team_players_schema.ts";
export const matches = pgTable(
  "match",
  {
    id: uuid("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => auth_user.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "restrict" }),
    teamNameAtMatch: text("team_name_at_match").notNull(),
    opponentName: text("opponent_name").notNull(),
    scheduledDate: date("scheduled_date", { mode: "string" }),
    venueRole: text("venue_role"),
    status: text("status").notNull(),
    periods: jsonb("periods").$type<Match["periods"]>().notNull().default([]),
    startedAt: bigint("started_at", { mode: "number" }),
    revision: integer("revision").notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [index("match_owner_idx").on(table.ownerUserId)],
);
export const matchPlayers = pgTable(
  "match_player",
  {
    id: uuid("id").primaryKey(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "restrict" }),
    playerNameAtMatch: text("player_name_at_match").notNull(),
    jerseyNumber: text("jersey_number"),
    role: teamPlayerRole("role").notNull(),
    isStarter: boolean("is_starter").notNull(),
  },
  (table) => [
    unique("match_player_pair_unique").on(table.matchId, table.playerId),
    index("match_player_match_idx").on(table.matchId),
  ],
);
