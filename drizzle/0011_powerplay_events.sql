ALTER TABLE "match_event" ADD COLUMN "starts_powerplay" boolean;--> statement-breakpoint
ALTER TABLE "match_event" ADD COLUMN "removed_match_player_id" uuid;--> statement-breakpoint
ALTER TABLE "match_event" ADD COLUMN "powerplay_card_event_id" uuid;--> statement-breakpoint
ALTER TABLE "match_event" ADD COLUMN "entry_reason" text;--> statement-breakpoint
ALTER TABLE "match_event" ADD CONSTRAINT "match_event_removed_match_player_id_match_player_id_fk" FOREIGN KEY ("removed_match_player_id") REFERENCES "public"."match_player"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_event" ADD CONSTRAINT "match_event_powerplay_card_fk" FOREIGN KEY ("powerplay_card_event_id") REFERENCES "public"."match_event"("id") ON DELETE restrict ON UPDATE no action;