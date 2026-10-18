import { z } from "zod";

export const playerNameSchema = z
  .string()
  .min(1)
  .refine((name) => name === name.trim());
