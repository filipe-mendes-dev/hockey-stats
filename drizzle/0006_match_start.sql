ALTER TABLE "match" ADD COLUMN "periods" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "started_at" bigint;