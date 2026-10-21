"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  formatMatchTime,
  getClockElapsed,
} from "../../../../domain/matches/matchControl";
import type { MatchControlAction } from "../../../../domain/matches/matchControl";
import { ActionIcon, Button, NumberInput, Tooltip } from "@mantine/core";
import { Flag, Pause, Play, TimerReset } from "lucide-react";
import { ResponsiveFormDialog } from "../../../components/ResponsiveFormDialog/ResponsiveFormDialog";
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
  const [minutes, setMinutes] = useState<string | number>(0);
  const [seconds, setSeconds] = useState<string | number>(0);
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
    const current = remaining ?? elapsed ?? duration ?? 0;
    setMinutes(Math.floor(current / 60_000));
    setSeconds(Math.floor(current / 1000) % 60);
    mutation.reset();
    setPanel(next);
  }
  if (match.status !== "live") return null;
  const shownTime = remaining ?? elapsed;
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
            aria-label={t(
              duration === undefined ? "elapsedTime" : "remainingTime",
            )}
          >
            {running && now === 0
              ? "…"
              : shownTime === undefined
                ? t("untimed")
                : formatMatchTime(
                    duration === undefined
                      ? shownTime
                      : Math.ceil(shownTime / 1000) * 1000,
                  )}
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
        submitDisabled={
          panel === "adjust" &&
          (!Number.isInteger(minutes) ||
            Number(minutes) < 0 ||
            !Number.isInteger(seconds) ||
            Number(seconds) < 0 ||
            Number(seconds) > 59 ||
            (duration !== undefined &&
              Number(minutes) * 60_000 + Number(seconds) * 1000 > duration))
        }
        onClose={() => setPanel(null)}
        onSubmit={(event) => {
          event.preventDefault();
          if (panel !== "adjust") {
            control({ type: panel === "finish" ? "match.end" : "period.end" });
            return;
          }
          const entered = Number(minutes) * 60_000 + Number(seconds) * 1000;
          if (
            !Number.isInteger(minutes) ||
            Number(minutes) < 0 ||
            !Number.isInteger(seconds) ||
            Number(seconds) < 0 ||
            Number(seconds) > 59 ||
            (duration !== undefined && entered > duration)
          )
            return;
          control({
            type: "clock.adjust",
            elapsedMs: duration === undefined ? entered : duration - entered,
          });
        }}
      >
        {panel === "adjust" ? (
          <>
            <p className={st.help}>
              {t(duration === undefined ? "adjustElapsed" : "adjustRemaining")}
            </p>
            <div className={st.inputs}>
              <NumberInput
                label={t("minutes")}
                value={minutes}
                onChange={setMinutes}
                min={0}
                allowDecimal={false}
                hideControls
                disabled={mutation.isPending}
              />
              <NumberInput
                label={t("seconds")}
                value={seconds}
                onChange={setSeconds}
                min={0}
                max={59}
                allowDecimal={false}
                hideControls
                disabled={mutation.isPending}
              />
            </div>
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
