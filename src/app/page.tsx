import { redirect } from "next/navigation";
import { HomePage as HomePageView } from "../client/pages/HomePage/HomePage";
import { getSession } from "../server/auth/session";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return <HomePageView name={session.user.name} />;
}
