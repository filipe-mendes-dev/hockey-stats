CREATE TABLE "match_player" (
	"id" uuid PRIMARY KEY NOT NULL,
	"match_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"player_name_at_match" text NOT NULL,
	"jersey_number" text,
	"role" "team_player_role" NOT NULL,
	"is_starter" boolean NOT NULL,
	CONSTRAINT "match_player_pair_unique" UNIQUE("match_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "match" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"team_id" uuid NOT NULL,
	"team_name_at_match" text NOT NULL,
	"opponent_name" text NOT NULL,
	"scheduled_date" date,
	"venue_role" text,
	"status" text NOT NULL,
	"revision" integer NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "match_player" ADD CONSTRAINT "match_player_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player" ADD CONSTRAINT "match_player_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_owner_user_id_auth_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_player_match_idx" ON "match_player" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "match_owner_idx" ON "match" USING btree ("owner_user_id");