CREATE TABLE "entity_deletion" (
	"owner_user_id" text NOT NULL,
	"feature" text NOT NULL,
	"id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"deleted_at" bigint NOT NULL,
	CONSTRAINT "entity_deletion_owner_user_id_feature_id_pk" PRIMARY KEY("owner_user_id","feature","id")
);
--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "archived_at" bigint;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "archived_at" bigint;--> statement-breakpoint
ALTER TABLE "entity_deletion" ADD CONSTRAINT "entity_deletion_owner_user_id_auth_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;