"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTeam } from "../../../features/teams/queries/teams.queries";
import { EntityPage } from "../../../components/EntityPage/EntityPage";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { DeliveryStatus } from "../../../features/sync/DeliveryStatus/DeliveryStatus";
import st from "./TeamDetailsPage.module.css";

export function TeamDetailsPage() {
  const t = useTranslations("teams");
  const params = useParams();
  const teamId = typeof params.id === "string" ? params.id : undefined;
  const teamQuery = useTeam(teamId);
  const syncText = useTranslations("sync");
  const team = teamQuery.data;

  return (
    <EntityPage
      backHref="/app/teams"
      backLabel={t("back")}
      title={t("detailsTitle")}
      storageNotice={t("storageNotice")}
    >
      {teamQuery.isPending || teamQuery.isError ? (
        <EntityDataStatus
          loadingLabel={t("loading")}
          failedLabel={t("loadFailed")}
          retryLabel={t("retry")}
          failed={teamQuery.isError}
          onRetry={() => {
            void teamQuery.refetch();
          }}
        />
      ) : team ? (
        <dl className={st.details}>
          <div>
            <dt>{syncText("title")}</dt>
            <dd>
              <DeliveryStatus kind="team.create" entityId={team.id} />
            </dd>
          </div>
          <div>
            <dt>{t("name")}</dt>
            <dd>{team.name}</dd>
          </div>
          {team.category && (
            <div>
              <dt>{t("category")}</dt>
              <dd>{team.category}</dd>
            </div>
          )}
          {team.season && (
            <div>
              <dt>{t("season")}</dt>
              <dd>{team.season}</dd>
            </div>
          )}
          <div>
            <dt>{t("teamId")}</dt>
            <dd>{team.id}</dd>
          </div>
        </dl>
      ) : (
        <div className={st.unavailable}>
          <h2>{t("unavailableTitle")}</h2>
          <p>{t("unavailableDescription")}</p>
        </div>
      )}
    </EntityPage>
  );
}
