"use client";
import { useEffect, useRef } from "react";
import { Alert, Button } from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { MatchRuleError } from "../../../../domain/matches/matchRules";
import { RecorderContext } from "../RecorderContext/RecorderContext";
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
  const selectionDetails = [
    draft.kind ? t(draft.kind) : undefined,
    draft.rinkHalf ? t(draft.rinkHalf) : undefined,
    draft.colour ? t(draft.colour) : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <RecorderDialog
      title={t("newEvent")}
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
              : draft.kind
                ? t(draft.kind)
                : t("newEvent"))
          }
          secondary={player || outgoing ? selectionDetails : undefined}
          kind={draft.kind}
        />
        {phase === "collecting" && (
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
