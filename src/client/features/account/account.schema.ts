import { z } from "zod";

export const localIdentitySchema = z.object({
  key: z.literal("identity"),
  ownerUserId: z.string().min(1),
  accountName: z.string(),
});
export type LocalIdentity = z.infer<typeof localIdentitySchema>;
