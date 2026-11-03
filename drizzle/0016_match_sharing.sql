CREATE TABLE "match_share" (
	"match_id" uuid PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "match_share_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "match_share" ADD CONSTRAINT "match_share_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;