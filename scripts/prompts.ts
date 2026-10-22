import { isCancel, password, text } from "@clack/prompts";
import { userPasswordSchema } from "../src/contracts/admin-users.schema.ts";

async function answer(result: Promise<string | symbol>): Promise<string> {
  const value = await result;
  if (isCancel(value)) throw new Error("Cancelled.");
  return value;
}

export async function readUsername(message: string): Promise<string> {
  const value = await answer(
    text({
      message,
      validate: (value) =>
        /^[a-zA-Z0-9_.]{3,30}$/.test((value ?? "").trim())
          ? undefined
          : "Use 3 to 30 letters, numbers, underscores or dots.",
    }),
  );
  return value.trim().toLowerCase();
}

export async function readName(): Promise<string> {
  const value = await answer(
    text({
      message: "Display name",
      validate: (value) =>
        value?.trim() ? undefined : "Enter a display name.",
    }),
  );
  return value.trim();
}

export async function readPassword(message: string): Promise<string> {
  return answer(
    password({
      message,
      validate: (value) =>
        typeof value === "string" && value.length >= 8 && value.length <= 128
          ? undefined
          : "Use 8 to 128 characters.",
    }),
  );
}

export async function readNewPassword(): Promise<string> {
  const value = await answer(
    password({
      message: "Initial password",
      validate: (value) =>
        userPasswordSchema.safeParse(value).success
          ? undefined
          : "Use 12 to 128 characters; the password cannot be blank.",
    }),
  );
  await answer(
    password({
      message: "Confirm initial password",
      validate: (confirmation) =>
        confirmation === value ? undefined : "Passwords do not match.",
    }),
  );
  return value;
}

export function reportFailure(error: unknown): void {
  console.error(
    error instanceof Error ? error.message : "User creation failed.",
  );
  process.exitCode = 1;
}
