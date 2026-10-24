"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getCountdownMs,
  getClockElapsed,
} from "../../../../domain/matches/matchControl";
import type { MatchControlAction } from "../../../../domain/matches/matchControl";
import { ActionIcon, Button, Tooltip } from "@mantine/core";
import { ArrowRight, Pause, Play, TimerReset } from "lucide-react";
import { ResponsiveFormDialog } from "../../../components/ResponsiveFormDialog/ResponsiveFormDialog";
import { DurationCounter } from "../../../components/DurationCounter/DurationCounter";
import {
  getDurationFields,
  parseDurationFields,
} from "../../../components/DurationCounter/durationFields";
import { RecorderContext } from "../RecorderContext/RecorderContext";
import { useControlMatch } from "../mutations/matchControl.mutations";
import type { MatchControlsProps } from "./MatchControls.interfaces";
import { FinishFlag } from "./FinishFlag";
import st from "./MatchControls.module.css";
export function MatchControls({
  match,
  now,
  disabled,
  onBusyChange,
}: MatchControlsProps) {
  const t = useTranslations("recorder");
  const mutation = useControlMatch();
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
  const atZero = remaining === 0;
  const finalPeriod = match.currentPeriod === match.periods.length;
  function openFinish(): void {
    open(finalPeriod ? "finish" : "period");
  }
  const primaryFinishLabel = t(finalPeriod ? "endMatch" : "nextPeriod");
  const clockLabel = t(
    running ? "pauseClock" : elapsed === 0 ? "startClock" : "resumeClock",
  );
  const finishLabel = t(
    match.currentPeriod === match.periods.length ? "endMatch" : "endPeriod",
  );
  return (
    <section className={st.controls} aria-label={t("clockTitle")}>
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
          className={st.primary}
          size="sm"
          disabled={
            disabled || busy || (!atZero && !running && duration === undefined)
          }
          onClick={() =>
            atZero
              ? openFinish()
              : control({ type: running ? "clock.pause" : "clock.start" })
          }
          leftSection={
            atZero ? (
              finalPeriod ? (
                <FinishFlag />
              ) : (
                <ArrowRight size={16} aria-hidden="true" />
              )
            ) : running ? (
              <Pause size={16} />
            ) : (
              <Play size={16} />
            )
          }
        >
          {atZero ? primaryFinishLabel : clockLabel}
        </Button>
        <div className={st.finish}>
          {!atZero && (
            <Tooltip
              label={finishLabel}
              events={{ hover: true, focus: true, touch: false }}
            >
              <ActionIcon
                variant="subtle"
                aria-label={finishLabel}
                disabled={disabled || busy}
                onClick={openFinish}
              >
                <FinishFlag />
              </ActionIcon>
            </Tooltip>
          )}
        </div>
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
