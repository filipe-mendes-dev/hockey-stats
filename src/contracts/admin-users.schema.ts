import { z } from "zod";

export const usersPageSize = 20;

export interface AdminUser {
  id: string;
  name: string;
  username: string | null;
  role: "user" | "admin";
  disabled: boolean;
  createdAt: string;
}

export const adminUserSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  username: z.string().nullable(),
  role: z.enum(["user", "admin"]),
  disabled: z.boolean(),
  createdAt: z.iso.datetime(),
});

export interface UsersDirectory {
  users: AdminUser[];
  total: number;
  page: number;
}

export const usersDirectorySchema = z.object({
  users: z.array(adminUserSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
});

export interface UsersDirectoryQuery {
  search: string;
  page: number;
}

export const usersDirectoryQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
});

export const userNameSchema = z.string().trim().min(1).max(120);
export const minimumUserPasswordLength = 12;
export const maximumUserPasswordLength = 128;
export const userPasswordSchema = z
  .string()
  .min(minimumUserPasswordLength)
  .max(maximumUserPasswordLength)
  .refine((value) => value.trim().length > 0);
export const userUsernameSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_.]{3,30}$/)
  .transform((value) => value.toLowerCase());

const userIdSchema = z.string().min(1).max(200);

export const adminUserActionSchema = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("create"),
    name: userNameSchema,
    username: userUsernameSchema,
    password: userPasswordSchema,
  }),
  z.strictObject({
    action: z.literal("edit"),
    userId: userIdSchema,
    name: userNameSchema,
  }),
  z.strictObject({
    action: z.literal("password"),
    userId: userIdSchema,
    password: userPasswordSchema,
  }),
  z.strictObject({ action: z.literal("disable"), userId: userIdSchema }),
  z.strictObject({ action: z.literal("enable"), userId: userIdSchema }),
  z.strictObject({
    action: z.literal("delete"),
    userId: userIdSchema,
    confirmation: z.string().min(1).max(30),
  }),
]);

export type AdminUserAction = z.infer<typeof adminUserActionSchema>;

export const adminUsersErrorCodeSchema = z.enum([
  "authentication_required",
  "forbidden",
  "account_mismatch",
  "invalid_input",
  "username_taken",
  "user_not_found",
  "protected_account",
  "disable_before_delete",
  "confirmation_mismatch",
  "session_revocation_failed",
  "rate_limited",
  "unavailable",
]);

export type AdminUsersErrorCode = z.infer<typeof adminUsersErrorCodeSchema>;
