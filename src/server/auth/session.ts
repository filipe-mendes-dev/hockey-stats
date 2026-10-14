import "server-only";
import { headers } from "next/headers";
import { auth } from "./auth.ts";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
}
