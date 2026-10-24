"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMatch } from "../../../features/matches/queries/matches.queries";
import { PageHeader } from "../../../components/PageHeader/PageHeader";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { EventRecorder } from "../../../features/matches/EventRecorder/EventRecorder";
import st from "./LiveMatchPage.module.css";
export function LiveMatchPage() {
  const t = useTranslations("matches");
  const params = useSearchParams();
  const router = useRouter();
  const query = useMatch(params.get("id") ?? undefined);
  const snapshot = query.data;
  const destination =
    snapshot && snapshot.match.status !== "live"
      ? `/app/matches/${snapshot.match.status === "completed" ? "view" : "start"}?id=${encodeURIComponent(snapshot.match.id)}`
      : undefined;
  useEffect(() => {
    if (destination && !query.isPending && !query.isError)
      router.replace(destination);
  }, [destination, query.isPending, query.isError, router]);
  if (snapshot?.match.status === "live")
    return <EventRecorder key={snapshot.match.id} snapshot={snapshot} />;
  return (
    <section className={st.page}>
      <PageHeader
        title={t("liveTitle")}
        back={{
          href: snapshot
            ? `/app/matches/view?id=${encodeURIComponent(snapshot.match.id)}`
            : "/app/matches",
          label: t("backToDetails"),
        }}
      />
      {query.isPending || query.isError || destination ? (
        <EntityDataStatus
          loadingLabel={t("loading")}
          failedLabel={t("loadFailed")}
          retryLabel={t("retry")}
          failed={query.isError}
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : (
        <p>{t("unavailableDescription")}</p>
      )}
    </section>
  );
}
