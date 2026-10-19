ALTER TABLE "match_event" ADD COLUMN "outgoing_match_player_id" uuid;--> statement-breakpoint
ALTER TABLE "match_event" ADD COLUMN "incoming_match_player_id" uuid;--> statement-breakpoint
ALTER TABLE "match_event" ADD COLUMN "replacement_match_player_id" uuid;--> statement-breakpoint
ALTER TABLE "match_event" ADD COLUMN "lineup_effect" text;--> statement-breakpoint
ALTER TABLE "match_event" ADD CONSTRAINT "match_event_outgoing_match_player_id_match_player_id_fk" FOREIGN KEY ("outgoing_match_player_id") REFERENCES "public"."match_player"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_event" ADD CONSTRAINT "match_event_incoming_match_player_id_match_player_id_fk" FOREIGN KEY ("incoming_match_player_id") REFERENCES "public"."match_player"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_event" ADD CONSTRAINT "match_event_replacement_match_player_id_match_player_id_fk" FOREIGN KEY ("replacement_match_player_id") REFERENCES "public"."match_player"("id") ON DELETE restrict ON UPDATE no action;