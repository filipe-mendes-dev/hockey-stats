import { z } from "zod";
import { playerSchema } from "../player.schema";
import { createPlayerInputSchema } from "./createPlayer.schema";

export const updatePlayerInputSchema = createPlayerInputSchema.extend({
  id: playerSchema.shape.id,
  expectedRevision: z.int().positive(),
});
export type UpdatePlayerInput = z.infer<typeof updatePlayerInputSchema>;
