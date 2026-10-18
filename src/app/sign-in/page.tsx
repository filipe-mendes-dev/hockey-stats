import { redirect } from "next/navigation";
import { SignInPage as SignInPageView } from "../../client/pages/SignInPage/SignInPage";
import { AppShell } from "../../client/components/AppShell/AppShell";
import { getSession } from "../../server/auth/session";

export default async function SignInPage() {
  const session = await getSession();
  if (session) redirect("/app");
  return (
    <AppShell>
      <SignInPageView />
    </AppShell>
  );
}
