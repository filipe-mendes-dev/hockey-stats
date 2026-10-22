"use client";
import { useState } from "react";
import { Alert, Button } from "@mantine/core";
import { useTranslations } from "next-intl";
import type { AddMatchEventInput } from "../../../../domain/matches/matchEvent.schema";
import { formatMatchTime } from "../../../../domain/matches/matchControl";
import { getPowerplayDuration } from "../../../../domain/matches/powerplay";
import { DurationCounter } from "../../../components/DurationCounter/DurationCounter";
import {
  getDurationFields,
  parseDurationFields,
} from "../../../components/DurationCounter/durationFields";
import { captureEventDraft } from "../EventRecorder/eventDraft";
import { EventTimeForm } from "../EventTimeForm/EventTimeForm";
import { useAddMatchEvent } from "../mutations/matchEvents.mutations";
import { RecorderContext } from "../RecorderContext/RecorderContext";
import { RecorderDialog } from "../RecorderDialog/RecorderDialog";
import type { PowerplayCorrectionDialogProps } from "./PowerplayCorrectionDialog.interfaces";
import st from "./PowerplayCorrectionDialog.module.css";

export function PowerplayCorrectionDialog({
  match,
  penalties,
  onClose,
}: PowerplayCorrectionDialogProps) {
  const t = useTranslations("recorder");
  const current = penalties[0];
  const [capture, setCapture] = useState(() =>
    captureEventDraft(match, { kind: "powerplay-end" }, current?.cardEventId),
  );
  const [duration, setDuration] = useState(() =>
    getDurationFields(
      Math.ceil(
        (current?.remainingMs ??
          (current ? getPowerplayDuration(current.colour) : 0)) / 1000,
      ) * 1000,
    ),
  );
  const [submitted, setSubmitted] = useState<AddMatchEventInput | null>(null);
  const mutation = useAddMatchEvent();
  const remaining = parseDurationFields(duration, 3_600_000);
  const locked = mutation.isPending || mutation.isError;
  function save(): void {
    if (
      !capture.gameTime ||
      !capture.powerplayCardEventId ||
      remaining === null
    )
      return;
    const common = {
      id: capture.id,
      operationId: capture.operationId,
      matchId: capture.matchId,
      period: capture.period,
      capturedAt: capture.capturedAt,
      gameTime: capture.gameTime,
      powerplayCardEventId: capture.powerplayCardEventId,
    };
    const input: AddMatchEventInput =
      remaining === 0
        ? { ...common, kind: "powerplay-end" }
        : {
            ...common,
            kind: "powerplay-adjust",
            powerplayDurationMs: remaining,
          };
    setSubmitted(input);
    mutation.mutate(input, { onSuccess: onClose });
  }
  return (
    <RecorderDialog
      title={t("correctPowerplay")}
      pending={mutation.isPending}
      onClose={onClose}
      footer={
        <div className={st.actions}>
          <Button
            variant="subtle"
            disabled={mutation.isPending}
            onClick={onClose}
          >
            {t("cancel")}
          </Button>
          {mutation.isError && submitted ? (
            <Button
              onClick={() => mutation.mutate(submitted, { onSuccess: onClose })}
            >
              {t("retry")}
            </Button>
          ) : (
            <Button
              disabled={locked || !capture.gameTime || remaining === null}
              onClick={save}
            >
              {t("savePowerplay")}
            </Button>
          )}
        </div>
      }
    >
      <div className={st.content}>
        <RecorderContext
          match={match}
          period={capture.period}
          elapsedMs={capture.gameTime?.elapsedMs}
          primary={t("correctPowerplay")}
        />
        <p className={st.help}>{t("powerplayCorrectionHelp")}</p>
        {!capture.gameTime ? (
          <EventTimeForm
            durationMs={
              match.periods.find((period) => period.number === capture.period)
                ?.durationMs
            }
            onApply={(elapsedMs) =>
              setCapture({ ...capture, gameTime: { elapsedMs } })
            }
          />
        ) : (
          <fieldset className={st.fields} disabled={locked}>
            <legend>{t("penaltyRemaining")}</legend>
            <DurationCounter
              value={duration}
              onChange={setDuration}
              maxMs={3_600_000}
              minutesLabel={t("minutes")}
              secondsLabel={t("seconds")}
              disabled={locked}
            />
          </fieldset>
        )}
        <ol className={st.penalties}>
          {penalties.map((penalty, index) => (
            <li key={penalty.cardEventId}>
              <span
                className={st.card}
                data-colour={penalty.colour}
                aria-hidden="true"
              />
              <span>{t(penalty.colour)}</span>
              <span className={st.detail}>
                {index === 0 ? t("penaltyCurrent") : t("penaltyQueued")}
              </span>
              <span className={st.time}>
                {penalty.remainingMs === undefined
                  ? t("untimed")
                  : formatMatchTime(
                      Math.ceil(penalty.remainingMs / 1000) * 1000,
                    )}
              </span>
            </li>
          ))}
        </ol>
        {mutation.isError && (
          <Alert color="red" role="alert">
            {t("powerplayCorrectionFailed")}
          </Alert>
        )}
      </div>
    </RecorderDialog>
  );
}
