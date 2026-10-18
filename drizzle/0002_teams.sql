CREATE TABLE "team" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"season" text,
	"revision" integer NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_owner_user_id_auth_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_owner_idx" ON "team" USING btree ("owner_user_id");