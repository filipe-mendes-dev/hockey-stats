ALTER TABLE "match" ADD COLUMN "current_period" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "clock" jsonb;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "closed_periods" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "completed_at" bigint;