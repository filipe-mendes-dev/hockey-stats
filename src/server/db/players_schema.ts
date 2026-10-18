import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  CreatePlayerCommand,
  PlayerAcknowledgement,
} from "../../contracts/players-sync.schema";
import { auth_user } from "./auth_schema.ts";

export const players = pgTable(
  "player",
  {
    id: uuid("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => auth_user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    revision: integer("revision").notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [index("player_owner_idx").on(table.ownerUserId)],
);

export const operationReceipts = pgTable(
  "operation_receipt",
  {
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => auth_user.id, { onDelete: "cascade" }),
    operationId: uuid("operation_id").notNull(),
    command: jsonb("command").$type<CreatePlayerCommand>().notNull(),
    result: jsonb("result").$type<PlayerAcknowledgement>().notNull(),
    acceptedAt: bigint("accepted_at", { mode: "number" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.ownerUserId, table.operationId] })],
);
