import type { Metadata } from "next";
import type { MatchStatisticsView } from "../../../contracts/match-statistics-view.schema";
import { notFound } from "next/navigation";
import { getSharedMatchStatistics } from "../../../server/features/sharing/matchSharing.service";
import {
  SharedMatchPage,
  SharedMatchUnavailable,
} from "../../../client/pages/matches/SharedMatchPage/SharedMatchPage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata: Metadata = {
  title: "Benchline Stats",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PublicMatchPage({
  params,
}: PageProps<"/share/[token]">) {
  const { token } = await params;
  let view: MatchStatisticsView | null;
  try {
    view = await getSharedMatchStatistics(token);
  } catch {
    return <SharedMatchUnavailable failed />;
  }
  if (!view) notFound();
  return <SharedMatchPage view={view} />;
}
