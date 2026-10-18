"use client";
import { useState } from "react";
import type { MatchSnapshot } from "../../../../domain/matches/match.schema";
import { MatchForm } from "../../../features/matches/MatchForm/MatchForm";
import { useUpdateMatchSetup } from "../../../features/matches/mutations/matches.mutations";
import {
  MatchChangedError,
  MatchReferencesUnavailableError,
} from "../../../features/matches/matches.service";
import { Button, ButtonLink } from "../../../components/Button/Button";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { useMatch } from "../../../features/matches/queries/matches.queries";
import { formatMatchDate } from "../../../features/matches/date";
import { EntityPage } from "../../../components/EntityPage/EntityPage";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { DeliveryStatus } from "../../../features/sync/DeliveryStatus/DeliveryStatus";
import st from "./MatchDetailsPage.module.css";
export function MatchDetailsPage() {
  const t = useTranslations("matches");
  const assignment = useTranslations("teamPlayers");
  const syncText = useTranslations("sync");
  const { locale } = useLanguage();
  const params = useSearchParams();
  const query = useMatch(params.get("id") ?? undefined);
  const snapshot = query.data;
  const update = useUpdateMatchSetup();
  const [editing, setEditing] = useState<MatchSnapshot | null>(null);
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  return (
    <EntityPage
      backHref="/app/matches"
      backLabel={t("back")}
      title={t("detailsTitle")}
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
        <div>
          <h2>{t("unavailableTitle")}</h2>
          <p>{t("unavailableDescription")}</p>
        </div>
      ) : (
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
                        {player.jerseyNumber
                          ? ` · #${player.jerseyNumber}`
                          : ""}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </section>
          {snapshot.match.status === "setup" ? (
            editing && editing.match.id === snapshot.match.id ? (
              <MatchForm
                key={`${editing.match.id}-${editing.match.revision}`}
                initial={editing}
                pending={update.isPending}
                failed={update.isError}
                failedLabel={
                  update.error instanceof MatchChangedError
                    ? t("changed")
                    : update.error instanceof MatchReferencesUnavailableError
                      ? t("referencesUnavailable")
                      : t("saveFailed")
                }
                submitLabel={t("saveSetup")}
                onCancel={() => {
                  setEditing(null);
                  update.reset();
                }}
                onSave={async (input) => {
                  await update.mutateAsync({
                    ...input,
                    id: editing.match.id,
                    expectedRevision: editing.match.revision,
                  });
                  setEditing(null);
                }}
              />
            ) : (
              <div className={st.actions}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditing(snapshot);
                    update.reset();
                  }}
                >
                  {t("editSetup")}
                </Button>
                <ButtonLink href={`/app/matches/start?id=${snapshot.match.id}`}>
                  {t("start")}
                </ButtonLink>
              </div>
            )
          ) : (
            <ButtonLink href={`/app/matches/live?id=${snapshot.match.id}`}>
              {t("resume")}
            </ButtonLink>
          )}
        </div>
      )}
    </EntityPage>
  );
}
