"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePlayer } from "../../../features/players/queries/players.queries";
import { EntityPage } from "../../../components/EntityPage/EntityPage";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { DeliveryStatus } from "../../../features/sync/DeliveryStatus/DeliveryStatus";
import st from "./PlayerDetailsPage.module.css";

export function PlayerDetailsPage() {
  const t = useTranslations("players");
  const params = useParams();
  const searchParams = useSearchParams();
  const playerId =
    searchParams.get("id") ??
    (typeof params.id === "string" ? params.id : undefined);
  const playerQuery = usePlayer(playerId);
  const syncText = useTranslations("sync");
  const player = playerQuery.data;

  return (
    <EntityPage
      backHref="/app/players"
      backLabel={t("back")}
      title={t("detailsTitle")}
      storageNotice={t("storageNotice")}
    >
      {playerQuery.isPending || playerQuery.isError ? (
        <EntityDataStatus
          loadingLabel={t("loading")}
          failedLabel={t("loadFailed")}
          retryLabel={t("retry")}
          failed={playerQuery.isError}
          onRetry={() => {
            void playerQuery.refetch();
          }}
        />
      ) : player ? (
        <dl className={st.details}>
          <div>
            <dt>{syncText("title")}</dt>
            <dd>
              <DeliveryStatus kind="player.create" entityId={player.id} />
            </dd>
          </div>
          <div>
            <dt>{t("name")}</dt>
            <dd>{player.name}</dd>
          </div>
          <div>
            <dt>{t("playerId")}</dt>
            <dd>{player.id}</dd>
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
