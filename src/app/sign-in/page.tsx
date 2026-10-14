import { redirect } from "next/navigation";
import { LoginForm } from "../../client/auth/login-form";
import { AppShell } from "../../client/shell/app-shell";
import { getSession } from "../../server/auth/session";

export default async function SignInPage() {
  const session = await getSession();
  if (session) redirect("/");
  return (
    <AppShell>
      <LoginForm />
    </AppShell>
  );
}
