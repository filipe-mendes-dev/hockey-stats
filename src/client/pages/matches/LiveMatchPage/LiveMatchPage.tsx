"use client";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMatch } from "../../../features/matches/queries/matches.queries";
import { EntityPage } from "../../../components/EntityPage/EntityPage";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { ButtonLink } from "../../../components/Button/Button";
import { EventRecorder } from "../../../features/matches/EventRecorder/EventRecorder";
import st from "./LiveMatchPage.module.css";
export function LiveMatchPage() {
  const t = useTranslations("matches");
  const params = useSearchParams();
  const query = useMatch(params.get("id") ?? undefined);
  const snapshot = query.data;
  if (snapshot?.match.status === "live")
    return <EventRecorder key={snapshot.match.id} snapshot={snapshot} />;
  return (
    <EntityPage
      backHref={
        snapshot ? `/app/matches/view?id=${snapshot.match.id}` : "/app/matches"
      }
      backLabel={t("backToDetails")}
      title={t(
        snapshot?.match.status === "completed" ? "summaryTitle" : "liveTitle",
      )}
      storageNotice={t("storageNotice")}
    >
      {query.isPending || query.isError ? (
        <EntityDataStatus
          loadingLabel={t("loading")}
          failedLabel={t("loadFailed")}
          retryLabel={t("retry")}
          failed={query.isError}
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : !snapshot ? (
        <p>{t("unavailableDescription")}</p>
      ) : (
        <>
          <h2>
            {snapshot.match.teamNameAtMatch} · {snapshot.match.opponentName}
          </h2>
          {snapshot.match.status === "setup" ? (
            <ButtonLink href={`/app/matches/start?id=${snapshot.match.id}`}>
              {t("start")}
            </ButtonLink>
          ) : (
            <div className={st.content}>
              <EventRecorder key={snapshot.match.id} snapshot={snapshot} />
              <section>
                <h2>{t("periods")}</h2>

                <ul className={st.list}>
                  {snapshot.match.periods.map((period) => (
                    <li key={period.number}>
                      <strong>
                        {t("periodLabel", { number: period.number })}
                      </strong>
                      <span>
                        {period.durationMs
                          ? t("periodDuration", {
                              minutes: period.durationMs / 60_000,
                            })
                          : t("noDuration")}
                      </span>
                      <span>{t(period.attackDirection)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </>
      )}
    </EntityPage>
  );
}
