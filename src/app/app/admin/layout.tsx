import { redirect } from "next/navigation";
import { getSession } from "../../../server/auth/session";

export default async function AdminLayout({
  children,
}: LayoutProps<"/app/admin">) {
  const session = await getSession();
  if (!session || session.user.banned) redirect("/sign-in");
  if (session.user.role !== "admin") redirect("/app");
  return children;
}
