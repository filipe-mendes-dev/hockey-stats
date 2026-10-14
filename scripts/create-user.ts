import { randomUUID } from "node:crypto";
import { auth } from "../src/server/auth/auth.ts";
import { pool } from "../src/server/db/client.ts";
import {
  readName,
  readNewPassword,
  readPassword,
  readUsername,
  reportFailure,
} from "./prompts.ts";

async function main(): Promise<void> {
  const administrator = await readUsername("Your admin username");
  const adminPassword = await readPassword("Your admin password");
  const login = await auth.api.signInUsername({
    body: { username: administrator, password: adminPassword },
    asResponse: true,
  });
  if (!login.ok) throw new Error("Admin sign-in failed.");

  const headers = new Headers();
  headers.set(
    "cookie",
    login.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; "),
  );

  try {
    const session = await auth.api.getSession({
      headers,
      query: { disableCookieCache: true },
    });
    if (session?.user.role !== "admin")
      throw new Error("An admin account is required.");

    const username = await readUsername("New user's username");
    const name = await readName();
    const password = await readNewPassword();
    await auth.api.createUser({
      headers,
      body: {
        email: `${randomUUID()}@users.benchline.invalid`,
        name,
        password,
        data: { username },
      },
    });
    console.log(`Created user ${username}.`);
  } finally {
    await auth.api.signOut({ headers });
  }
}

try {
  await main();
} catch (error: unknown) {
  reportFailure(error);
} finally {
  await pool.end();
}
