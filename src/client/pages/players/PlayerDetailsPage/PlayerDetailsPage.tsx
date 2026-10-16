"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePlayersPreview } from "../../../features/players/PlayersPreviewProvider";
import st from "./PlayerDetailsPage.module.css";

export function PlayerDetailsPage() {
  const t = useTranslations("players");
  const params = useParams();
  const { players } = usePlayersPreview();
  const playerId = typeof params.id === "string" ? params.id : undefined;
  const player = players.find((candidate) => candidate.id === playerId);

  return (
    <section className={st.page}>
      <Link className={st.back} href="/app/players" prefetch={false}>
        {t("back")}
      </Link>
      <header className={st.pageHeader}>
        <h1>{t("detailsTitle")}</h1>
      </header>
      {player ? (
        <dl className={st.details}>
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
      <p className={st.preview}>{t("previewNotice")}</p>
    </section>
  );
}
