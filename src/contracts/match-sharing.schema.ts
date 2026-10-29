import { z } from "zod";

export const shareTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const matchSharingRequestSchema = z.strictObject({
  expectedRevision: z.int().positive(),
});
export const matchSharingStatusSchema = z.strictObject({
  url: z.url().nullable(),
});
export const matchSharingErrorCodeSchema = z.enum([
  "authentication_required",
  "account_mismatch",
  "forbidden",
  "invalid_input",
  "match_unavailable",
  "match_not_completed",
  "revision_conflict",
  "sync_required",
  "unavailable",
]);
export type MatchSharingStatus = z.infer<typeof matchSharingStatusSchema>;
export type MatchSharingErrorCode = z.infer<typeof matchSharingErrorCodeSchema>;
