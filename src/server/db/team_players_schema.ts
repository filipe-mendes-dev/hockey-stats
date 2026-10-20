import {
  bigint,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { auth_user } from "./auth_schema.ts";
import { players } from "./players_schema.ts";
import { teams } from "./teams_schema.ts";
export const teamPlayerRole = pgEnum("team_player_role", [
  "field-player",
  "goalkeeper",
]);
export const teamPlayers = pgTable(
  "team_player",
  {
    id: uuid("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => auth_user.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    jerseyNumber: text("jersey_number"),
    role: teamPlayerRole("role").notNull(),
    revision: integer("revision").notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [
    unique("team_player_pair_unique").on(table.teamId, table.playerId),
    index("team_player_owner_idx").on(table.ownerUserId),
    index("team_player_team_idx").on(table.teamId),
  ],
);
