"use client";

import { useTranslations } from "next-intl";
import {
  formatCountdown,
  getClockElapsed,
  getCountdownMs,
} from "../../../../domain/matches/matchControl";
import { PowerplayIndicator } from "../PowerplayIndicator/PowerplayIndicator";
import type { MatchScoreboardProps } from "./MatchScoreboard.interfaces";
import st from "./MatchScoreboard.module.css";

export function MatchScoreboard({
  match,
  now,
  powerplays,
  ownScore,
  opponentScore,
  disabled,
  onCorrectPowerplay,
}: MatchScoreboardProps) {
  const t = useTranslations("recorder");
  const duration = match.periods.find(
    (period) => period.number === match.currentPeriod,
  )?.durationMs;
  const elapsed = getClockElapsed(match, now);
  const remaining = getCountdownMs(elapsed, duration);
  const running = match.clock?.runningSince !== undefined;

  return (
    <section aria-label={t("scoreTitle")}>
      <div className={st.scoreboard}>
        <div className={st.team}>
          <div className={st.teamHeading}>
            <span className={st.teamName} title={match.teamNameAtMatch}>
              {match.teamNameAtMatch}
            </span>
          </div>
          <strong>{ownScore ?? "…"}</strong>
        </div>
        <div className={st.time} data-powerplay={powerplays.length > 0}>
          <span className={st.period}>
            {t("periodNumber", { number: match.currentPeriod })}
          </span>
          {powerplays.length > 0 && (
            <div className={st.penalty}>
              <PowerplayIndicator
                penalties={powerplays}
                disabled={disabled}
                onCorrect={onCorrectPowerplay}
              />
            </div>
          )}
          <output
            aria-live="off"
            className={st.clock}
            aria-label={t("remainingTime")}
          >
            {running && now === 0
              ? "…"
              : (formatCountdown(elapsed, duration) ?? t("untimed"))}
          </output>
          <span className={st.status} data-running={running && remaining !== 0}>
            {t(running && remaining !== 0 ? "clockRunning" : "clockPaused")}
          </span>
        </div>
        <div className={st.team}>
          <div className={st.teamHeading}>
            <span className={st.teamName} title={match.opponentName}>
              {match.opponentName}
            </span>
          </div>
          <strong>{opponentScore ?? "…"}</strong>
        </div>
      </div>
    </section>
  );
}
