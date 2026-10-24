"use client";

import { DeleteEntityAction } from "../../../features/removal/DeleteEntityAction/DeleteEntityAction";
import { useState } from "react";
import Link from "next/link";
import { ActionIcon, Button, Group, Text, Title, Tooltip } from "@mantine/core";
import { Pencil } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { MatchSnapshot } from "../../../../domain/matches/match.schema";
import { PageHeader } from "../../../components/PageHeader/PageHeader";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { DeliveryStatus } from "../../../features/sync/DeliveryStatus/DeliveryStatus";
import { MatchStatusBadge } from "../../../features/matches/MatchStatusBadge/MatchStatusBadge";
import { MatchCallUpSummary } from "../../../features/matches/MatchCallUpSummary/MatchCallUpSummary";
import { MatchCallUpReview } from "../../../features/matches/MatchCallUpReview/MatchCallUpReview";
import { EditMatchDetailsDialog } from "../../../features/matches/EditMatchDetailsDialog/EditMatchDetailsDialog";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { useMatch } from "../../../features/matches/queries/matches.queries";
import { formatMatchDate } from "../../../features/matches/date";
import { getHalfDurationMinutes } from "../../../../domain/matches/matchFormat";
import { EditMatchCallUpPage } from "../EditMatchCallUpPage/EditMatchCallUpPage";
import { CompletedMatchDetails } from "./CompletedMatchDetails";
import st from "./MatchDetailsPage.module.css";

export function MatchDetailsPage() {
  const t = useTranslations("matches");
  const { locale } = useLanguage();
  const params = useSearchParams();
  const query = useMatch(params.get("id") ?? undefined);
  const snapshot = query.data;
  const [editing, setEditing] = useState<MatchSnapshot | null>(null);
  if (query.isPending || query.isError || !snapshot)
    return (
      <section className={st.page}>
        <PageHeader
          title={t("detailsTitle")}
          back={{ href: "/app/matches", label: t("back") }}
        />
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
        ) : (
          <div className={st.unavailable}>
            <Title order={2}>{t("unavailableTitle")}</Title>
            <Text>{t("unavailableDescription")}</Text>
          </div>
        )}
      </section>
    );
  if (snapshot.match.status === "setup" && params.get("edit") === "call-up")
    return <EditMatchCallUpPage key={snapshot.match.id} snapshot={snapshot} />;
  if (snapshot.match.status === "completed")
    return (
      <CompletedMatchDetails key={snapshot.match.id} snapshot={snapshot} />
    );
  const { match } = snapshot;
  const setup = match.status === "setup";
  const destination = `/app/matches/${setup ? "start" : "live"}?id=${encodeURIComponent(match.id)}`;
  const editHref = `/app/matches/view?id=${encodeURIComponent(match.id)}&edit=call-up`;
  const action = t(setup ? "prepare" : "resume");
  const duration = getHalfDurationMinutes(match.periods);
  const description = [
    match.scheduledDate ? formatMatchDate(match.scheduledDate, locale) : null,
    match.venueRole ? t(match.venueRole) : null,
    duration !== undefined ? t("matchFormat", { minutes: duration }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const players = [...snapshot.players]
    .sort((a, b) => collator.compare(a.playerNameAtMatch, b.playerNameAtMatch))
    .map((player) => ({
      playerId: player.playerId,
      name: player.playerNameAtMatch,
      role: player.role,
      jerseyNumber: player.jerseyNumber ?? "",
    }));
  return (
    <section className={st.page} data-mobile-actions>
      <PageHeader
        stackActionsOnMobile
        title={t("matchLabel", {
          team: match.teamNameAtMatch,
          opponent: match.opponentName,
        })}
        {...(description ? { description } : {})}
        back={{ href: "/app/matches", label: t("back") }}
        actions={
          <div className={st.headerActions}>
            <Group gap="xs" wrap="nowrap">
              <DeleteEntityAction
                target={{
                  feature: "matches",
                  id: match.id,
                  expectedRevision: match.revision,
                  name: `${match.teamNameAtMatch} · ${match.opponentName}`,
                  live: match.status === "live",
                }}
                redirectHref="/app/matches"
              />
              <MatchStatusBadge status={match.status} />
              <DeliveryStatus compact kind="match.create" entityId={match.id} />
              {setup && (
                <Tooltip label={t("editDetails")}>
                  <ActionIcon
                    type="button"
                    aria-label={t("editDetails")}
                    aria-haspopup="dialog"
                    onClick={() => setEditing(snapshot)}
                  >
                    <Pencil size={17} strokeWidth={1.6} aria-hidden="true" />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
            <Button
              component={Link}
              href={destination}
              prefetch={false}
              size="sm"
              className={st.desktopAction}
            >
              {action}
            </Button>
          </div>
        }
      />
      <section className={st.callUp} aria-labelledby="match-call-up">
        <div className={st.sectionHeader}>
          <h2 id="match-call-up">{t("callUp")}</h2>
          {setup && (
            <Button
              component={Link}
              href={editHref}
              prefetch={false}
              size="sm"
              variant="subtle"
            >
              {t(players.length ? "editCallUp" : "addCallUpPlayers")}
            </Button>
          )}
        </div>
        <MatchCallUpSummary players={players} />
        <MatchCallUpReview players={players} />
      </section>
      <div className={st.mobileAction}>
        <Button
          component={Link}
          href={destination}
          prefetch={false}
          size="sm"
          fullWidth
        >
          {action}
        </Button>
      </div>
      {editing && (
        <EditMatchDetailsDialog
          key={`${editing.match.id}-${editing.match.revision}`}
          snapshot={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
