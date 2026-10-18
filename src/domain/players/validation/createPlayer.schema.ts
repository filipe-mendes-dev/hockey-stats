import { z } from "zod";
import { playerNameSchema } from "./player.rules";

export const createPlayerInputSchema = z.object({
  name: z.string().trim().pipe(playerNameSchema),
});

export type CreatePlayerInput = z.infer<typeof createPlayerInputSchema>;
