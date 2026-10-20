CREATE TYPE "public"."team_player_role" AS ENUM('field-player', 'goalkeeper');--> statement-breakpoint
CREATE TYPE "public"."team_player_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "team_player" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"team_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"jersey_number" text,
	"role" "team_player_role" NOT NULL,
	"status" "team_player_status" NOT NULL,
	"revision" integer NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "team_player_pair_unique" UNIQUE("team_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "team_player" ADD CONSTRAINT "team_player_owner_user_id_auth_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_player" ADD CONSTRAINT "team_player_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_player" ADD CONSTRAINT "team_player_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_player_owner_idx" ON "team_player" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "team_player_team_idx" ON "team_player" USING btree ("team_id");