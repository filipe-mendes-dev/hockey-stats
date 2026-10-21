"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  formatCountdown,
  getCountdownMs,
  getClockElapsed,
} from "../../../../domain/matches/matchControl";
import type { MatchControlAction } from "../../../../domain/matches/matchControl";
import { ActionIcon, Button, Tooltip } from "@mantine/core";
import { Flag, Pause, Play, TimerReset } from "lucide-react";
import { ResponsiveFormDialog } from "../../../components/ResponsiveFormDialog/ResponsiveFormDialog";
import { DurationCounter } from "../../../components/DurationCounter/DurationCounter";
import {
  getDurationFields,
  parseDurationFields,
} from "../../../components/DurationCounter/durationFields";
import { RecorderContext } from "../RecorderContext/RecorderContext";
import { useControlMatch } from "../mutations/matchControl.mutations";
import type { MatchControlsProps } from "./MatchControls.interfaces";
import st from "./MatchControls.module.css";
export function MatchControls({
  match,
  ownScore,
  opponentScore,
  disabled,
  onBusyChange,
}: MatchControlsProps) {
  const t = useTranslations("recorder");
  const mutation = useControlMatch();
  const [now, setNow] = useState(0);
  const [panel, setPanel] = useState<"adjust" | "finish" | "period" | null>(
    null,
  );
  const [clockFields, setClockFields] = useState(() => getDurationFields(0));
  const [capturedElapsed, setCapturedElapsed] = useState<number | undefined>(
    undefined,
  );
  const lastAutoPause = useRef<number | undefined>(undefined);
  const period = match.periods.find(
    (entry) => entry.number === match.currentPeriod,
  );
  const duration = period?.durationMs;
  const elapsed = getClockElapsed(match, now);
  const remaining =
    duration === undefined || elapsed === undefined
      ? undefined
      : Math.max(0, duration - elapsed);
  const running = match.clock?.runningSince !== undefined;
  const busy = mutation.isPending || panel !== null;
  useEffect(() => {
    onBusyChange(busy);
    return () => onBusyChange(false);
  }, [busy, onBusyChange]);
  useEffect(() => {
    if (match.status !== "live") return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [match.status]);
  useEffect(() => {
    if (
      match.status !== "live" ||
      disabled ||
      busy ||
      !running ||
      remaining !== 0 ||
      now === 0 ||
      lastAutoPause.current === match.revision
    )
      return;
    lastAutoPause.current = match.revision;
    mutation.mutate({
      id: match.id,
      expectedRevision: match.revision,
      action: { type: "clock.pause" },
    });
  }, [match, disabled, busy, running, remaining, now, mutation]);
  function control(action: MatchControlAction): void {
    mutation.mutate(
      { id: match.id, expectedRevision: match.revision, action },
      { onSuccess: () => setPanel(null) },
    );
  }
  function open(next: "adjust" | "finish" | "period"): void {
    const current = getCountdownMs(elapsed, duration) ?? elapsed ?? 0;
    setCapturedElapsed(elapsed);
    setClockFields(getDurationFields(current));
    mutation.reset();
    setPanel(next);
  }
  if (match.status !== "live") return null;
  const enteredTime = parseDurationFields(clockFields, duration);
  const finishLabel = t(
    match.currentPeriod === match.periods.length ? "endMatch" : "endPeriod",
  );
  return (
    <section className={st.controls} aria-label={t("scoreTitle")}>
      <div className={st.scoreboard}>
        <div className={st.team}>
          <span title={match.teamNameAtMatch}>{match.teamNameAtMatch}</span>
          <strong>{ownScore ?? "…"}</strong>
        </div>
        <div className={st.time}>
          <span className={st.period}>
            {t("periodNumber", { number: match.currentPeriod })}
          </span>
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
          <span title={match.opponentName}>{match.opponentName}</span>
          <strong>{opponentScore ?? "…"}</strong>
        </div>
      </div>
      <div className={st.actions}>
        <Tooltip label={t("adjustClock")}>
          <ActionIcon
            variant="subtle"
            aria-label={t("adjustClock")}
            disabled={disabled || busy}
            onClick={() => open("adjust")}
          >
            <TimerReset size={18} />
          </ActionIcon>
        </Tooltip>
        <Button
          size="sm"
          disabled={
            disabled ||
            busy ||
            (!running && (duration === undefined || remaining === 0))
          }
          onClick={() =>
            control({ type: running ? "clock.pause" : "clock.start" })
          }
          leftSection={running ? <Pause size={16} /> : <Play size={16} />}
        >
          {t(running ? "pauseClock" : "startClock")}
        </Button>
        <Tooltip label={finishLabel}>
          <ActionIcon
            variant="subtle"
            aria-label={finishLabel}
            disabled={disabled || busy}
            onClick={() =>
              open(
                match.currentPeriod === match.periods.length
                  ? "finish"
                  : "period",
              )
            }
          >
            <Flag size={18} />
          </ActionIcon>
        </Tooltip>
      </div>
      {duration === undefined && <p role="status">{t("durationRequired")}</p>}
      {mutation.isError && !panel && (
        <p role="alert" className={st.error}>
          {t("controlFailed")}
        </p>
      )}
      <ResponsiveFormDialog
        opened={panel !== null}
        title={panel === "adjust" ? t("adjustClock") : finishLabel}
        closeLabel={t("cancel")}
        cancelLabel={t("cancel")}
        submitLabel={panel === "adjust" ? t("saveClock") : finishLabel}
        pending={mutation.isPending}
        error={mutation.isError ? t("controlFailed") : null}
        submitDisabled={panel === "adjust" && enteredTime === null}
        onClose={() => setPanel(null)}
        onSubmit={(event) => {
          event.preventDefault();
          if (panel !== "adjust") {
            control({ type: panel === "finish" ? "match.end" : "period.end" });
            return;
          }
          if (enteredTime === null) return;
          control({
            type: "clock.adjust",
            elapsedMs:
              duration === undefined ? enteredTime : duration - enteredTime,
          });
        }}
      >
        <RecorderContext
          match={match}
          period={match.currentPeriod}
          elapsedMs={capturedElapsed}
          primary={panel === "adjust" ? t("adjustClock") : finishLabel}
        />
        {panel === "adjust" ? (
          <>
            {duration === undefined && (
              <p className={st.help}>{t("adjustElapsed")}</p>
            )}
            <DurationCounter
              value={clockFields}
              onChange={setClockFields}
              maxMs={duration}
              minutesLabel={t("minutes")}
              secondsLabel={t("seconds")}
              disabled={mutation.isPending}
            />
          </>
        ) : (
          <p className={st.help}>
            {t(
              panel === "finish" ? "finishConfirmation" : "periodConfirmation",
            )}
          </p>
        )}
      </ResponsiveFormDialog>
    </section>
  );
}
