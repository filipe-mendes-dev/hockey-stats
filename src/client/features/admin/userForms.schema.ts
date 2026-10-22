import { z } from "zod";
import {
  userNameSchema,
  userPasswordSchema,
  userUsernameSchema,
} from "../../../contracts/admin-users.schema";

export const passwordFieldsSchema = z
  .object({
    password: userPasswordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    path: ["passwordConfirmation"],
  });

export const newUserFormSchema = passwordFieldsSchema.safeExtend({
  name: userNameSchema,
  username: userUsernameSchema,
});
