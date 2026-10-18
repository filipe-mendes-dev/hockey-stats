"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  usePlayer,
  usePlayerDelivery,
} from "../../../features/players/queries/players.queries";
import { PlayersDataStatus } from "../../../features/players/PlayersDataStatus/PlayersDataStatus";
import st from "./PlayerDetailsPage.module.css";

export function PlayerDetailsPage() {
  const t = useTranslations("players");
  const params = useParams();
  const playerId = typeof params.id === "string" ? params.id : undefined;
  const playerQuery = usePlayer(playerId);
  const delivery = usePlayerDelivery();
  const syncText = useTranslations("sync");
  const operation = delivery.data?.find((entry) => entry.playerId === playerId);
  const player = playerQuery.data;

  return (
    <section className={st.page}>
      <Link className={st.back} href="/app/players" prefetch={false}>
        {t("back")}
      </Link>
      <header className={st.pageHeader}>
        <h1>{t("detailsTitle")}</h1>
      </header>
      {playerQuery.isPending || playerQuery.isError ? (
        <PlayersDataStatus
          failed={playerQuery.isError}
          onRetry={() => {
            void playerQuery.refetch();
          }}
        />
      ) : player ? (
        <dl className={st.details}>
          {delivery.data && (
            <div>
              <dt>{syncText("title")}</dt>
              <dd>
                {syncText(
                  operation?.status === "blocked"
                    ? "playerBlocked"
                    : operation
                      ? "saved"
                      : "playerSynced",
                )}
              </dd>
            </div>
          )}
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
      <p className={st.storageNotice}>{t("storageNotice")}</p>
    </section>
  );
}
