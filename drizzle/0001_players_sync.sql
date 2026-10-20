CREATE TABLE "operation_receipt" (
	"owner_user_id" text NOT NULL,
	"operation_id" uuid NOT NULL,
	"command" jsonb NOT NULL,
	"result" jsonb NOT NULL,
	"accepted_at" bigint NOT NULL,
	CONSTRAINT "operation_receipt_owner_user_id_operation_id_pk" PRIMARY KEY("owner_user_id","operation_id")
);
--> statement-breakpoint
CREATE TABLE "player" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"name" text NOT NULL,
	"revision" integer NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "operation_receipt" ADD CONSTRAINT "operation_receipt_owner_user_id_auth_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_owner_user_id_auth_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "player_owner_idx" ON "player" USING btree ("owner_user_id");