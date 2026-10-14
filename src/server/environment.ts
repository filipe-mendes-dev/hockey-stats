import "server-only";

function requiredValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required. See .env.example.`);
  return value;
}

export function getDatabaseUrl(): string {
  const value = requiredValue("DATABASE_URL");
  const url = new URL(value);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname ||
    !url.username ||
    url.pathname.length < 2
  ) {
    throw new Error(
      "DATABASE_URL must identify a PostgreSQL database and user.",
    );
  }
  return value;
}

export function getAuthEnvironment() {
  const secret = requiredValue("BETTER_AUTH_SECRET");
  if (secret.length < 32 || secret.startsWith("replace-")) {
    throw new Error(
      "BETTER_AUTH_SECRET must be a random secret of at least 32 characters.",
    );
  }
  const url = new URL(requiredValue("BETTER_AUTH_URL"));
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "BETTER_AUTH_URL must be the application's HTTP(S) origin.",
    );
  }
  return { secret, baseURL: url.origin };
}
