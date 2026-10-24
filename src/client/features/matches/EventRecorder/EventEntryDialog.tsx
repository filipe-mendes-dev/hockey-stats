"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Alert, Button } from "@mantine/core";
import { useTranslations } from "next-intl";
import { MatchRuleError } from "../../../../domain/matches/matchRules";
import { ScoreCorrectionForm } from "../ScoreCorrectionForm/ScoreCorrectionForm";
import { RecorderContext } from "../RecorderContext/RecorderContext";
import { MatchEventUnavailableError } from "../matchEvents.service";
import { RecorderDialog } from "../RecorderDialog/RecorderDialog";
import { EventDraftFields } from "./EventDraftFields";
import { RecorderRinkPicker } from "../RecorderRink/RecorderRinkPicker";
import { supportsRinkPosition } from "../../../../domain/matches/rinkPosition";
import { getEventDraftSteps } from "./eventDraftSteps";
import type { EventEntryDialogProps } from "./EventEntryDialog.interfaces";
import st from "./EventEntryDialog.module.css";
export function EventEntryDialog({
  draft,
  context,
  phase,
  error,
  onAction,
  onRetry,
  rink,
}: EventEntryDialogProps) {
  const t = useTranslations("recorder");
  const locked = phase === "saving" || rink.gestureActive;
  const scoreFormId = useId();
  const [opponentScore, setOpponentScore] = useState<number | string>(
    context.state.opponentScore,
  );
  const scoreCorrection = draft.kind === "score-adjustment";
  const validScore =
    typeof opponentScore === "number" &&
    Number.isInteger(opponentScore) &&
    opponentScore >= 0 &&
    Math.abs(opponentScore - context.state.opponentScore) <= 2147483647 &&
    opponentScore !== context.state.opponentScore;
  const remaining = getEventDraftSteps(draft);
  const heading = useRef<HTMLHeadingElement>(null);
  const step = remaining[0];
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [step]);
  const player = context.snapshot.players.find(
    (entry) => entry.id === draft.matchPlayerId,
  );
  const specialAttempt =
    draft.kind === "shot" &&
    (draft.attemptType === "penalty" ||
      draft.attemptType === "direct-free-hit");
  const showRink =
    !specialAttempt &&
    !draft.selectingSetPiece &&
    draft.entry !== "game" &&
    (!draft.kind || supportsRinkPosition(draft.kind));
  const outgoing = context.snapshot.players.find(
    (entry) => entry.id === draft.outgoingMatchPlayerId,
  );
  const incoming = context.snapshot.players.find(
    (entry) => entry.id === draft.incomingMatchPlayerId,
  );
  const selectionDetails = [
    draft.kind ? t(draft.kind) : undefined,
    draft.rinkHalf ? t(draft.rinkHalf) : undefined,
    draft.colour ? t(draft.colour) : undefined,
    specialAttempt && draft.attemptType ? t(draft.attemptType) : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <RecorderDialog
      title={
        specialAttempt && draft.attemptType
          ? t(draft.attemptType)
          : draft.selectingSetPiece
            ? t("set-piece")
            : draft.kind
              ? t(draft.kind)
              : draft.entry === "game"
                ? t("gameEvent")
                : t("newEvent")
      }
      pending={locked}
      onClose={() => onAction({ type: "cancel" })}
      footer={
        <>
          <Button
            size="sm"
            variant="subtle"
            disabled={locked}
            onClick={() => onAction({ type: "cancel" })}
          >
            {t("cancel")}
          </Button>
          {scoreCorrection && phase === "collecting" && (
            <Button
              type="submit"
              form={scoreFormId}
              size="md"
              disabled={!validScore}
              className={st.submit}
            >
              {t("saveScore")}
            </Button>
          )}
        </>
      }
    >
      <div className={st.content}>
        <RecorderContext
          match={context.snapshot.match}
          period={draft.period}
          elapsedMs={draft.gameTime?.elapsedMs}
          primary={
            player?.playerNameAtMatch ??
            (outgoing
              ? [outgoing.playerNameAtMatch, incoming?.playerNameAtMatch]
                  .filter(Boolean)
                  .join(" → ")
              : specialAttempt && draft.attemptType
                ? t(draft.attemptType)
                : draft.entry === "game" && !draft.kind
                  ? t("gameEvent")
                  : draft.kind
                    ? t(draft.kind)
                    : t("newEvent"))
          }
          secondary={player || outgoing ? selectionDetails : undefined}
          kind={draft.kind}
        />
        {showRink && (
          <RecorderRinkPicker
            period={draft.period}
            direction={rink.direction}
            position={draft.position}
            disabled={phase !== "collecting"}
            controlsDisabled={locked || phase === "failed"}
            onStart={rink.onStart}
            onSelect={rink.onSelect}
            onCancelGesture={rink.onCancelGesture}
            onChangeDirection={rink.onChangeDirection}
            onClear={
              draft.position
                ? () => onAction({ type: "clearPosition" })
                : undefined
            }
          />
        )}
        {phase === "collecting" && !scoreCorrection && (
          <>
            <h2 ref={heading} className={st.heading} tabIndex={-1}>
              {step === "eventTimeRequired" &&
              context.snapshot.match.periods.find(
                (period) => period.number === draft.period,
              )?.durationMs === undefined
                ? t("elapsedTime")
                : step
                  ? t(step)
                  : t("saving")}
            </h2>
            <div inert={rink.gestureActive}>
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
            </div>
          </>
        )}
        {phase === "collecting" && scoreCorrection && (
          <ScoreCorrectionForm
            formId={scoreFormId}
            ownName={context.snapshot.match.teamNameAtMatch}
            opponentName={context.snapshot.match.opponentName}
            ownScore={context.state.ownScore}
            opponentScore={context.state.opponentScore}
            value={opponentScore}
            onChange={setOpponentScore}
            onApply={() => {
              if (validScore)
                onAction({
                  type: "setScoreAdjustment",
                  ownDelta: 0,
                  opponentDelta:
                    Number(opponentScore) - context.state.opponentScore,
                });
            }}
          />
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
