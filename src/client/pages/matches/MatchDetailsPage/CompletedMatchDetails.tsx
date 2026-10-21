"use client";

import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { EntityPage } from "../../../components/EntityPage/EntityPage";
import { DeliveryStatus } from "../../../features/sync/DeliveryStatus/DeliveryStatus";
import { EventRecorder } from "../../../features/matches/EventRecorder/EventRecorder";
import { formatMatchDate } from "../../../features/matches/date";
import type { CompletedMatchDetailsProps } from "./CompletedMatchDetails.interfaces";
import st from "./CompletedMatchDetails.module.css";

export function CompletedMatchDetails({
  snapshot,
}: CompletedMatchDetailsProps) {
  const t = useTranslations("matches");
  const assignment = useTranslations("teamPlayers");
  const syncText = useTranslations("sync");
  const { locale } = useLanguage();
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  return (
    <EntityPage
      backHref="/app/matches"
      backLabel={t("back")}
      title={t("summaryTitle")}
      storageNotice={t("storageNotice")}
    >
      <div className={st.content}>
        <dl className={st.details}>
          <div>
            <dt>{t("team")}</dt>
            <dd>{snapshot.match.teamNameAtMatch}</dd>
          </div>
          <div>
            <dt>{t("opponent")}</dt>
            <dd>{snapshot.match.opponentName}</dd>
          </div>
          {snapshot.match.scheduledDate && (
            <div>
              <dt>{t("date")}</dt>
              <dd>{formatMatchDate(snapshot.match.scheduledDate, locale)}</dd>
            </div>
          )}
          {snapshot.match.venueRole && (
            <div>
              <dt>{t("venueRole")}</dt>
              <dd>{t(snapshot.match.venueRole)}</dd>
            </div>
          )}
          <div>
            <dt>{t("status")}</dt>
            <dd>{t(snapshot.match.status)}</dd>
          </div>
          <div>
            <dt>{syncText("title")}</dt>
            <dd>
              <DeliveryStatus
                kind="match.create"
                entityId={snapshot.match.id}
              />
            </dd>
          </div>
          <div>
            <dt>{t("matchId")}</dt>
            <dd>{snapshot.match.id}</dd>
          </div>
        </dl>
        <section>
          <h2>{t("callUp")}</h2>
          {snapshot.players.length === 0 ? (
            <p>{t("emptyCallUp")}</p>
          ) : (
            <ul className={st.players}>
              {[...snapshot.players]
                .sort((a, b) =>
                  collator.compare(a.playerNameAtMatch, b.playerNameAtMatch),
                )
                .map((player) => (
                  <li key={player.id}>
                    <strong>{player.playerNameAtMatch}</strong>
                    <span>
                      {assignment(player.role)}
                      {player.jerseyNumber ? ` · #${player.jerseyNumber}` : ""}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </section>
        <EventRecorder key={snapshot.match.id} snapshot={snapshot} />
      </div>
    </EntityPage>
  );
}
