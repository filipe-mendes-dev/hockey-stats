import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { auth } from "../src/server/auth/auth.ts";
import { db, pool } from "../src/server/db/client.ts";
import { auth_user } from "../src/server/db/schema.ts";
import {
  readName,
  readNewPassword,
  readUsername,
  reportFailure,
} from "./prompts.ts";

async function main(): Promise<void> {
  const existing = await db
    .select({ id: auth_user.id })
    .from(auth_user)
    .where(eq(auth_user.role, "admin"))
    .limit(1);
  if (existing.length > 0)
    throw new Error(
      "An admin already exists. Bootstrap does not create another or change existing users.",
    );

  const username = await readUsername("Admin username");
  const name = await readName();
  const password = await readNewPassword();
  await auth.api.createUser({
    body: {
      email: `${randomUUID()}@users.benchline.invalid`,
      name,
      password,
      role: "admin",
      data: { username },
    },
  });
  console.log(`Created admin ${username}. Sign in at /sign-in.`);
}

try {
  await main();
} catch (error: unknown) {
  reportFailure(error);
} finally {
  await pool.end();
}
