"use client";

import { useState } from "react";
import type { Team } from "../../../../domain/teams/team.schema";
import { TeamForm } from "../../../features/teams/TeamForm/TeamForm";
import { TeamRoster } from "../../../features/teams/TeamRoster/TeamRoster";
import { useUpdateTeam } from "../../../features/teams/mutations/teams.mutations";
import { LocalRevisionConflictError } from "../../../features/teams/teams.errors";
import { Button } from "../../../components/Button/Button";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTeam } from "../../../features/teams/queries/teams.queries";
import { EntityPage } from "../../../components/EntityPage/EntityPage";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { DeliveryStatus } from "../../../features/sync/DeliveryStatus/DeliveryStatus";
import st from "./TeamDetailsPage.module.css";

export function TeamDetailsPage() {
  const t = useTranslations("teams");
  const params = useParams();
  const searchParams = useSearchParams();
  const teamId =
    searchParams.get("id") ??
    (typeof params.id === "string" ? params.id : undefined);
  const teamQuery = useTeam(teamId);
  const update = useUpdateTeam();
  const [editing, setEditing] = useState<Team | null>(null);
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
        <div className={st.content}>
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
          {editing && editing.id === team.id ? (
            <TeamForm
              initial={editing}
              pending={update.isPending}
              failed={update.isError}
              failedLabel={
                update.error instanceof LocalRevisionConflictError
                  ? t("changed")
                  : t("saveFailed")
              }
              submitLabel={t("save")}
              onCancel={() => {
                setEditing(null);
                update.reset();
              }}
              onSave={async (fields) => {
                await update.mutateAsync({
                  ...fields,
                  id: editing.id,
                  expectedRevision: editing.revision,
                });
                setEditing(null);
              }}
            />
          ) : (
            <div>
              <Button
                onClick={() => {
                  setEditing(team);
                  update.reset();
                }}
              >
                {t("edit")}
              </Button>
            </div>
          )}
          <TeamRoster key={team.id} teamId={team.id} />
        </div>
      ) : (
        <div className={st.unavailable}>
          <h2>{t("unavailableTitle")}</h2>
          <p>{t("unavailableDescription")}</p>
        </div>
      )}
    </EntityPage>
  );
}
