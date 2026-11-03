"use client";

import { Clock3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCountdown } from "../../../../domain/matches/matchControl";
import type { RecorderTimeProps } from "./RecorderTime.interfaces";
import st from "./RecorderTime.module.css";

export function RecorderTime({ match, period, elapsedMs }: RecorderTimeProps) {
  const t = useTranslations("recorder");
  const time =
    formatCountdown(
      elapsedMs,
      match.periods.find((entry) => entry.number === period)?.durationMs,
    ) ?? t("untimed");

  return (
    <span className={st.time}>
      <Clock3 size={13} aria-hidden="true" />
      <span>{t("periodNumber", { number: period })}</span>
      <span aria-hidden="true">·</span>
      <strong>{time}</strong>
    </span>
  );
}
