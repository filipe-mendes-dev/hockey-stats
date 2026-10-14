import { defineConfig } from "drizzle-kit";
import { getDatabaseUrl } from "./src/server/environment.ts";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: getDatabaseUrl() },
});
