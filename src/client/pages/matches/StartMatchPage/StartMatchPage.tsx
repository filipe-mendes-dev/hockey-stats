"use client";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMatch } from "../../../features/matches/queries/matches.queries";
import { EntityPage } from "../../../components/EntityPage/EntityPage";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { ButtonLink } from "../../../components/Button/Button";
import { StartMatchForm } from "../../../features/matches/StartMatchForm/StartMatchForm";
export function StartMatchPage() {
  const t = useTranslations("matches");
  const params = useSearchParams();
  const query = useMatch(params.get("id") ?? undefined);
  const snapshot = query.data;
  return (
    <EntityPage
      backHref={
        snapshot ? `/app/matches/view?id=${snapshot.match.id}` : "/app/matches"
      }
      backLabel={t("backToDetails")}
      title={t("startTitle")}
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
          {snapshot.match.status === "live" ? (
            <ButtonLink href={`/app/matches/live?id=${snapshot.match.id}`}>
              {t("resume")}
            </ButtonLink>
          ) : (
            <StartMatchForm key={snapshot.match.id} snapshot={snapshot} />
          )}
        </>
      )}
    </EntityPage>
  );
}
