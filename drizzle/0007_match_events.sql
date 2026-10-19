CREATE TABLE "match_event" (
	"id" uuid PRIMARY KEY NOT NULL,
	"match_id" uuid NOT NULL,
	"match_player_id" uuid NOT NULL,
	"event_order" integer NOT NULL,
	"kind" text NOT NULL,
	"subtype" text NOT NULL,
	"period" integer NOT NULL,
	"game_time_ms" bigint,
	"position_x" double precision,
	"position_y" double precision,
	"captured_at" bigint NOT NULL,
	"revision" integer NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint,
	CONSTRAINT "match_event_order_unique" UNIQUE("match_id","event_order")
);
--> statement-breakpoint
ALTER TABLE "match_event" ADD CONSTRAINT "match_event_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_event" ADD CONSTRAINT "match_event_match_player_id_match_player_id_fk" FOREIGN KEY ("match_player_id") REFERENCES "public"."match_player"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_event_match_idx" ON "match_event" USING btree ("match_id");