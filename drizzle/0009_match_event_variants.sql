ALTER TABLE "match_event" ALTER COLUMN "match_player_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "match_event" ALTER COLUMN "subtype" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "match_event" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "match_event" ADD COLUMN "outcome" text;--> statement-breakpoint
ALTER TABLE "match_event" ADD COLUMN "colour" text;--> statement-breakpoint
ALTER TABLE "match_event" ADD COLUMN "own_delta" integer;--> statement-breakpoint
ALTER TABLE "match_event" ADD COLUMN "opponent_delta" integer;