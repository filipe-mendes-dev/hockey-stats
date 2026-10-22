"use client";
import { useTranslations } from "next-intl";
import { getPowerplayRemainingMs } from "../../../../domain/matches/powerplay";
import { formatMatchTime } from "../../../../domain/matches/matchControl";
import type { PowerplayIndicatorProps } from "./PowerplayIndicator.interfaces";
import st from "./PowerplayIndicator.module.css";

export function PowerplayIndicator({
  penalties,
  disabled,
  onCorrect,
}: PowerplayIndicatorProps) {
  const t = useTranslations("recorder");
  const current = penalties[0];
  if (!current) return null;
  const remainingMs = getPowerplayRemainingMs(penalties);
  const time =
    remainingMs === undefined
      ? t("untimed")
      : formatMatchTime(Math.ceil(remainingMs / 1000) * 1000);
  const description = t("powerplayIndicator", {
    count: penalties.length,
    time,
  });
  return (
    <button
      type="button"
      className={st.indicator}
      disabled={disabled}
      onClick={onCorrect}
      aria-label={description}
      title={description}
    >
      <span className={st.cards} aria-hidden="true">
        {penalties.slice(0, 3).map((penalty, index) => (
          <span
            key={penalty.cardEventId}
            className={st.card}
            data-colour={penalty.colour}
            data-queued={index > 0}
          />
        ))}
        {penalties.length > 3 && (
          <span className={st.more}>+{penalties.length - 3}</span>
        )}
      </span>
      <span className={st.time}>{time}</span>
    </button>
  );
}
