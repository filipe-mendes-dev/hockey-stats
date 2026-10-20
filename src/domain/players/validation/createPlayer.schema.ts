import { z } from "zod";
import { playerSchema } from "../player.schema";

export const createPlayerInputSchema = z.object({
  name: z.string().trim().pipe(playerSchema.shape.name),
});

export type CreatePlayerInput = z.infer<typeof createPlayerInputSchema>;
