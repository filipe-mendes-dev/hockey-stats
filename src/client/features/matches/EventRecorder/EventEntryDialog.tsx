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
import { HockeyRink } from "../../../components/HockeyRink/HockeyRink";
import { RecorderRinkPicker } from "../RecorderRink/RecorderRinkPicker";
import { toViewPosition } from "../../../../domain/matches/rinkPosition";
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
  liveElapsedMs,
}: EventEntryDialogProps) {
  const t = useTranslations("recorder");
  const [directionPending, setDirectionPending] = useState(false);
  const locked = phase === "saving" || directionPending;
  const scoreFormId = useId();
  const [opponentScore, setOpponentScore] = useState<number | string>(
    context.state.opponentScore,
  );
  const scoreCorrection = draft?.kind === "score-adjustment";
  const validScore =
    typeof opponentScore === "number" &&
    Number.isInteger(opponentScore) &&
    opponentScore >= 0 &&
    Math.abs(opponentScore - context.state.opponentScore) <= 2147483647 &&
    opponentScore !== context.state.opponentScore;
  const remaining = draft ? getEventDraftSteps(draft) : [];
  const heading = useRef<HTMLHeadingElement>(null);
  const step = remaining[0];
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [step, rink.picking]);
  const player = context.snapshot.players.find(
    (entry) => entry.id === draft?.matchPlayerId,
  );
  const specialAttempt =
    draft?.kind === "shot" &&
    (draft.attemptType === "penalty" ||
      draft.attemptType === "direct-free-hit");
  const outgoing = context.snapshot.players.find(
    (entry) => entry.id === draft?.outgoingMatchPlayerId,
  );
  const incoming = context.snapshot.players.find(
    (entry) => entry.id === draft?.incomingMatchPlayerId,
  );
  const selectionDetails = [
    draft?.kind ? t(draft.kind) : undefined,
    draft?.rinkHalf ? t(draft.rinkHalf) : undefined,
    draft?.colour ? t(draft.colour) : undefined,
    specialAttempt && draft?.attemptType ? t(draft.attemptType) : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <RecorderDialog
      title={
        specialAttempt && draft?.attemptType
          ? t(draft.attemptType)
          : t(rink.picking ? "recordOnRink" : "newEvent")
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
          period={draft?.period ?? context.snapshot.match.currentPeriod}
          elapsedMs={draft ? draft.gameTime?.elapsedMs : liveElapsedMs}
          primary={
            player?.playerNameAtMatch ??
            (outgoing
              ? [outgoing.playerNameAtMatch, incoming?.playerNameAtMatch]
                  .filter(Boolean)
                  .join(" → ")
              : draft?.kind
                ? t(draft.kind)
                : t("newEvent"))
          }
          secondary={player || outgoing ? selectionDetails : undefined}
          kind={draft?.kind}
        />
        {rink.picking && (
          <RecorderRinkPicker
            autoFocus
            match={context.snapshot.match}
            period={draft?.period ?? context.snapshot.match.currentPeriod}
            direction={rink.direction}
            position={draft?.position}
            onStart={rink.onStart}
            onSelect={rink.onSelect}
            onCancelGesture={rink.onCancelGesture}
            onDirectionPending={setDirectionPending}
          />
        )}
        {!specialAttempt &&
          !draft?.selectingSetPiece &&
          !rink.picking &&
          draft?.position &&
          rink.direction && (
            <div className={st.positionPreview}>
              <HockeyRink
                label={t("rinkSelected")}
                position={toViewPosition(draft.position, rink.direction)}
                orientation={{
                  attackingEnd:
                    rink.direction === "toward-x0" ? "left" : "right",
                  attackLabel: t("rinkAttack"),
                  defenceLabel: t("rinkDefence"),
                }}
              />
              <Button
                variant="subtle"
                size="sm"
                disabled={phase !== "collecting"}
                onClick={rink.onEdit}
              >
                {t("rinkChangePosition")}
              </Button>
            </div>
          )}
        {!rink.picking &&
          draft &&
          phase === "collecting" &&
          !scoreCorrection && (
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
        {!rink.picking && phase === "collecting" && scoreCorrection && (
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
