import { z } from "zod";

export const authenticatedUserSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  username: z.string().nullable().optional(),
});
export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;

export const localIdentitySchema = z.object({
  key: z.literal("identity"),
  ownerUserId: z.string().min(1),
  accountName: z.string(),
});
export type LocalIdentity = z.infer<typeof localIdentitySchema>;
