"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  formatMatchTime,
  getClockElapsed,
} from "../../../../domain/matches/matchControl";
import type { MatchControlAction } from "../../../../domain/matches/matchControl";
import { Button } from "../../../components/Button/Button";
import { Modal } from "../../../components/Modal/Modal";
import { useControlMatch } from "../mutations/matchControl.mutations";
import type { MatchControlsProps } from "./MatchControls.interfaces";
import st from "./MatchControls.module.css";
export function MatchControls({
  match,
  disabled,
  onBusyChange,
}: MatchControlsProps) {
  const t = useTranslations("recorder");
  const mutation = useControlMatch();
  const [now, setNow] = useState(0);
  const [panel, setPanel] = useState<"adjust" | "finish" | null>(null);
  const [returnFocusTo, setReturnFocusTo] = useState<HTMLElement | null>(null);
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
  function open(next: "adjust" | "finish"): void {
    setReturnFocusTo(
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null,
    );
    mutation.reset();
    setPanel(next);
  }
  if (match.status !== "live") return null;
  const shownTime = remaining ?? elapsed;
  return (
    <section className={st.controls} aria-label={t("clockTitle")}>
      <strong>{t("periodNumber", { number: match.currentPeriod })}</strong>
      <output
        aria-live="off"
        className={st.clock}
        aria-label={t(duration === undefined ? "elapsedTime" : "remainingTime")}
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
      <span>
        {t(running && remaining !== 0 ? "clockRunning" : "clockPaused")}
      </span>
      <div className={st.actions}>
        <Button
          disabled={
            disabled ||
            busy ||
            (!running && (duration === undefined || remaining === 0))
          }
          onClick={() =>
            control({ type: running ? "clock.pause" : "clock.start" })
          }
        >
          {t(running ? "pauseClock" : "startClock")}
        </Button>
        <Button
          variant="secondary"
          disabled={disabled || busy}
          onClick={() => open("adjust")}
        >
          {t("adjustClock")}
        </Button>
        <Button
          variant="secondary"
          disabled={disabled || busy}
          onClick={() =>
            match.currentPeriod === match.periods.length
              ? open("finish")
              : control({ type: "period.end" })
          }
        >
          {t(
            match.currentPeriod === match.periods.length
              ? "endMatch"
              : "endPeriod",
          )}
        </Button>
      </div>
      {duration === undefined && <p>{t("durationRequired")}</p>}
      {mutation.isError && <p role="alert">{t("controlFailed")}</p>}
      {panel && (
        <Modal
          title={t(panel === "finish" ? "endMatch" : "adjustClock")}
          locked={mutation.isPending}
          returnFocusTo={returnFocusTo}
          onDismiss={() => setPanel(null)}
        >
          {panel === "finish" ? (
            <div className={st.controls}>
              <p>{t("finishConfirmation")}</p>
              <Button
                disabled={mutation.isPending}
                onClick={() => control({ type: "match.end" })}
              >
                {t("endMatch")}
              </Button>
            </div>
          ) : (
            <form
              className={st.controls}
              action={(data) => {
                const minutes = Number(data.get("minutes"));
                const seconds = Number(data.get("seconds"));
                if (
                  !Number.isInteger(minutes) ||
                  minutes < 0 ||
                  !Number.isInteger(seconds) ||
                  seconds < 0 ||
                  seconds > 59
                )
                  return;
                const entered = minutes * 60_000 + seconds * 1000;
                control({
                  type: "clock.adjust",
                  elapsedMs:
                    duration === undefined ? entered : duration - entered,
                });
              }}
            >
              <p>
                {t(
                  duration === undefined ? "adjustElapsed" : "adjustRemaining",
                )}
              </p>
              <label>
                {t("minutes")}
                <input
                  name="minutes"
                  type="number"
                  min="0"
                  step="1"
                  required
                  defaultValue={Math.floor(
                    (shownTime ?? duration ?? 0) / 60_000,
                  )}
                  disabled={mutation.isPending}
                />
              </label>
              <label>
                {t("seconds")}
                <input
                  name="seconds"
                  type="number"
                  min="0"
                  max="59"
                  step="1"
                  required
                  defaultValue={
                    Math.floor((shownTime ?? duration ?? 0) / 1000) % 60
                  }
                  disabled={mutation.isPending}
                />
              </label>
              <Button type="submit" disabled={mutation.isPending}>
                {t("saveClock")}
              </Button>
            </form>
          )}
          {mutation.isError && <p role="alert">{t("controlFailed")}</p>}
          <Button
            variant="secondary"
            disabled={mutation.isPending}
            onClick={() => setPanel(null)}
          >
            {t("cancel")}
          </Button>
        </Modal>
      )}
    </section>
  );
}
