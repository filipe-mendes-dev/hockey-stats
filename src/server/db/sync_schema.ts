import {
  bigint,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  SyncCommand,
  SyncAcknowledgement,
} from "../../contracts/sync.schema";
import { auth_user } from "./auth_schema.ts";

export const operationReceipts = pgTable(
  "operation_receipt",
  {
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => auth_user.id, { onDelete: "cascade" }),
    operationId: uuid("operation_id").notNull(),
    command: jsonb("command").$type<SyncCommand>().notNull(),
    result: jsonb("result").$type<SyncAcknowledgement>().notNull(),
    acceptedAt: bigint("accepted_at", { mode: "number" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.ownerUserId, table.operationId] })],
);
