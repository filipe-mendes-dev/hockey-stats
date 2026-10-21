"use client";
import { Clock3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCountdown } from "../../../../domain/matches/matchControl";
import { RecorderActionIcon } from "../RecorderBoard/RecorderActionIcon";
import type { RecorderContextProps } from "./RecorderContext.interfaces";
import st from "./RecorderContext.module.css";
export function RecorderContext({
  match,
  period,
  elapsedMs,
  primary,
  secondary,
  kind,
}: RecorderContextProps) {
  const t = useTranslations("recorder");
  const time =
    formatCountdown(
      elapsedMs,
      match.periods.find((entry) => entry.number === period)?.durationMs,
    ) ?? t("untimed");
  return (
    <div className={st.context}>
      <div
        className={st.identity}
        title={[primary, secondary].filter(Boolean).join(" · ")}
      >
        {kind && <RecorderActionIcon kind={kind} size={18} />}
        <strong>{primary}</strong>
        {secondary && <span>{secondary}</span>}
      </div>
      <span className={st.time}>
        <Clock3 size={13} aria-hidden="true" />
        <span>{t("periodNumber", { number: period })}</span>
        <span aria-hidden="true">·</span>
        <strong>{time}</strong>
      </span>
    </div>
  );
}
