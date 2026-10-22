"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { DeliveryStatus } from "../../sync/DeliveryStatus/DeliveryStatus";
import { MatchStatusBadge } from "../MatchStatusBadge/MatchStatusBadge";
import { formatMatchDate } from "../date";
import type { MatchRowProps } from "./MatchRow.interfaces";
import st from "./MatchRow.module.css";

export function MatchRow({ snapshot: { match, players } }: MatchRowProps) {
  const t = useTranslations("matches");
  const { locale } = useLanguage();
  const title = t("matchLabel", {
    team: match.teamNameAtMatch,
    opponent: match.opponentName,
  });
  const context = [
    match.scheduledDate ? formatMatchDate(match.scheduledDate, locale) : null,
    match.venueRole ? t(match.venueRole) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const metadata = [t("calledUpCount", { count: players.length }), context]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className={st.row}>
      <Link
        href={`/app/matches/view?id=${encodeURIComponent(match.id)}`}
        prefetch={false}
        className={st.main}
        title={title}
      >
        <span className={st.mark} aria-hidden="true">
          <Trophy size={24} strokeWidth={1.5} />
        </span>
        <span className={st.title}>{title}</span>
        <span className={st.status}>
          <MatchStatusBadge status={match.status} />
        </span>
        <span className={st.metadata} title={metadata}>
          {metadata}
        </span>
      </Link>
      <DeliveryStatus compact kind="match.create" entityId={match.id} />
    </li>
  );
}
