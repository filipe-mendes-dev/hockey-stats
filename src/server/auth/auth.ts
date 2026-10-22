import "server-only";
import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { admin, username } from "better-auth/plugins";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "../db/client.ts";
import * as schema from "../db/schema.ts";
import { getAuthEnvironment } from "../environment.ts";
import { accessControl, roles } from "./permissions.ts";
import {
  maximumUserPasswordLength,
  minimumUserPasswordLength,
  userPasswordSchema,
} from "../../contracts/admin-users.schema.ts";

export const auth = betterAuth({
  ...getAuthEnvironment(),
  database: drizzleAdapter(db, { provider: "pg", schema, transaction: true }),
  user: { modelName: "auth_user" },
  session: { modelName: "auth_session", cookieCache: { enabled: false } },
  account: { modelName: "auth_account" },
  verification: { modelName: "auth_verification" },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: minimumUserPasswordLength,
    maxPasswordLength: maximumUserPasswordLength,
  },
  disabledPaths: [
    "/sign-up/email",
    "/sign-in/email",
    "/send-verification-email",
    "/verify-email",
    "/request-password-reset",
    "/reset-password",
    "/change-email",
    "/delete-user",
    "/update-user",
    "/is-username-available",
    "/admin/create-user",
    "/admin/list-users",
    "/admin/get-user",
    "/admin/update-user",
    "/admin/set-role",
    "/admin/ban-user",
    "/admin/unban-user",
    "/admin/set-user-password",
    "/admin/remove-user",
    "/admin/list-user-sessions",
    "/admin/revoke-user-session",
    "/admin/revoke-user-sessions",
    "/admin/impersonate-user",
    "/admin/stop-impersonating",
  ],
  plugins: [
    username({ immutableUsername: true, displayUsername: false }),
    admin({ ac: accessControl, roles, defaultRole: "user" }),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          const body: unknown = context?.body;
          const password: unknown =
            typeof body === "object" && body !== null && "password" in body
              ? body.password
              : undefined;
          if (!userPasswordSchema.safeParse(password).success) {
            throw new APIError("BAD_REQUEST", {
              message:
                "Password must contain 12 to 128 characters and cannot be blank.",
            });
          }
          const value: unknown = "username" in user ? user.username : undefined;
          if (
            typeof value !== "string" ||
            !/^[a-zA-Z0-9_.]{3,30}$/.test(value)
          ) {
            throw new APIError("BAD_REQUEST", {
              message: "A valid username is required.",
            });
          }
          if (!user.name.trim()) {
            throw new APIError("BAD_REQUEST", {
              message: "A display name is required.",
            });
          }
          return {
            data: {
              ...user,
              name: user.name.trim(),
              email: `${randomUUID()}@users.benchline.invalid`,
              emailVerified: false,
            },
          };
        },
      },
    },
  },
});
