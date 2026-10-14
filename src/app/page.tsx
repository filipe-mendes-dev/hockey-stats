import { redirect } from "next/navigation";
import { AppShell } from "../client/shell/app-shell";
import { HomeContent } from "../client/shell/home-content";
import { getSession } from "../server/auth/session";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return (
    <AppShell authenticated>
      <HomeContent name={session.user.name} />
    </AppShell>
  );
}
