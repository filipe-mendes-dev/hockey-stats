"use client";
import { useEffect, useRef } from "react";
import { Alert, Button, Stepper } from "@mantine/core";
import { ArrowLeft, Clock3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { MatchRuleError } from "../../../../domain/matches/matchRules";
import { formatMatchTime } from "../../../../domain/matches/matchControl";
import { MatchEventUnavailableError } from "../matchEvents.service";
import { RecorderDialog } from "../RecorderDialog/RecorderDialog";
import { EventDraftFields } from "./EventDraftFields";
import { getEventDraftSteps } from "./eventDraftSteps";
import type { EventEntryDialogProps } from "./EventEntryDialog.interfaces";
import st from "./EventEntryDialog.module.css";
export function EventEntryDialog({
  draft,
  context,
  phase,
  error,
  history,
  onAction,
  onRetry,
  onBack,
}: EventEntryDialogProps) {
  const t = useTranslations("recorder");
  const locked = phase === "saving";
  const remaining = getEventDraftSteps(draft);
  const steps = [
    ...history.flatMap((entry) => getEventDraftSteps(entry).slice(0, 1)),
    ...remaining,
  ];
  const heading = useRef<HTMLHeadingElement>(null);
  const step = remaining[0];
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [step]);
  const player = context.snapshot.players.find(
    (entry) => entry.id === draft.matchPlayerId,
  );
  const outgoing = context.snapshot.players.find(
    (entry) => entry.id === draft.outgoingMatchPlayerId,
  );
  const incoming = context.snapshot.players.find(
    (entry) => entry.id === draft.incomingMatchPlayerId,
  );
  return (
    <RecorderDialog
      title={draft.kind ? t(draft.kind) : t("newEvent")}
      pending={locked}
      onClose={() => onAction({ type: "cancel" })}
      footer={
        <>
          {history.length > 0 && phase === "collecting" && (
            <Button
              size="sm"
              variant="subtle"
              leftSection={<ArrowLeft size={16} />}
              onClick={onBack}
            >
              {t("back")}
            </Button>
          )}
          <Button
            size="sm"
            variant="subtle"
            disabled={locked}
            onClick={() => onAction({ type: "cancel" })}
          >
            {t("cancel")}
          </Button>
        </>
      }
    >
      <div className={st.content}>
        <div className={st.context}>
          <span className={st.time}>
            <Clock3 size={14} aria-hidden="true" />
            {t("eventTime", {
              period: draft.period,
              time: draft.gameTime
                ? formatMatchTime(draft.gameTime.elapsedMs)
                : t("untimed"),
            })}
          </span>
          {player && <strong>{player.playerNameAtMatch}</strong>}
          {outgoing && (
            <span>
              {t("outgoingPlayer", { name: outgoing.playerNameAtMatch })}
            </span>
          )}
          {incoming && (
            <span>
              {t("incomingPlayer", { name: incoming.playerNameAtMatch })}
            </span>
          )}
          {draft.colour && <span>{t(draft.colour)}</span>}
        </div>
        {steps.length > 1 && (
          <Stepper
            size="xs"
            active={history.length}
            allowNextStepsSelect={false}
            classNames={{
              root: st.progress,
              steps: st.steps,
              step: st.step,
              stepBody: st.stepBody,
            }}
            aria-label={t("eventProgress")}
          >
            {steps.map((label, index) => (
              <Stepper.Step
                key={`${label}-${index}`}
                aria-label={t(label)}
                tabIndex={-1}
                allowStepSelect={false}
              />
            ))}
          </Stepper>
        )}
        {phase === "collecting" && (
          <>
            <h2 ref={heading} className={st.heading} tabIndex={-1}>
              {step ? t(step) : t("saving")}
            </h2>
            <EventDraftFields
              draft={draft}
              context={context}
              durationMs={
                context.snapshot.match.periods.find(
                  (period) => period.number === draft.period,
                )?.durationMs
              }
              onAction={onAction}
            />
          </>
        )}
        {phase === "saving" && <p role="status">{t("saving")}</p>}
        {phase === "failed" && (
          <>
            <Alert color="red" role="alert">
              {t(
                error instanceof MatchRuleError
                  ? `rules.${error.reason}`
                  : error instanceof MatchEventUnavailableError
                    ? "changed"
                    : "saveFailed",
              )}
            </Alert>
            <Button onClick={onRetry}>{t("retry")}</Button>
          </>
        )}
      </div>
    </RecorderDialog>
  );
}
