"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "zustand";
import { useTranslations } from "next-intl";
import type { AddMatchEventInput } from "../../../../domain/matches/matchEvent.schema";
import { deriveMatchState } from "../../../../domain/matches/derivedMatchState";
import { MatchControls } from "../MatchControls/MatchControls";
import { RecorderHeader } from "../RecorderBoard/RecorderHeader";
import { RecorderPlayers } from "../RecorderBoard/RecorderPlayers";
import { RecorderActions } from "../RecorderBoard/RecorderActions";
import { RecorderTimeline } from "../RecorderTimeline/RecorderTimeline";
import { EventEntryDialog } from "./EventEntryDialog";
import {
  useMatchEvents,
  useLatestUndoEvent,
} from "../queries/matchEvents.queries";
import {
  useAddMatchEvent,
  useUndoMatchEvent,
} from "../mutations/matchEvents.mutations";
import { createEventDraftStore } from "./eventDraft.store";
import { completeEventDraft, captureEventDraft } from "./eventDraft";
import type { EventDraft, EventDraftAction } from "./eventDraft";
import type { EventRecorderProps } from "./EventRecorder.interfaces";
import st from "./EventRecorder.module.css";
export function EventRecorder({ snapshot }: EventRecorderProps) {
  const t = useTranslations("recorder");
  const [store] = useState(createEventDraftStore);
  const returnFocusTo = useRef<HTMLElement | null>(null);
  const [history, setHistory] = useState<EventDraft[]>([]);
  const state = useStore(store, (entry) => entry.state);
  const [controlsBusy, setControlsBusy] = useState(false);
  const readOnly = snapshot.match.status !== "live";
  const events = useMatchEvents(snapshot.match.id);
  const candidate = useLatestUndoEvent(snapshot.match.id);
  const derivedState = deriveMatchState(snapshot, events.data ?? []);
  const context = { snapshot, state: derivedState };
  const add = useAddMatchEvent();
  const undo = useUndoMatchEvent();
  const draft = state.phase === "idle" ? null : state.draft;
  useEffect(() => {
    if (state.phase !== "idle" || !returnFocusTo.current) return;
    const trigger = returnFocusTo.current;
    returnFocusTo.current = null;
    const frame = window.requestAnimationFrame(() => {
      if (trigger.isConnected) trigger.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state.phase]);
  function back(): void {
    const previous = history.at(-1);
    if (!previous) return;
    store.getState().dispatch({ type: "restoreChoices", draft: previous });
    setHistory((entries) => entries.slice(0, -1));
  }
  function save(input: AddMatchEventInput): void {
    void add
      .mutateAsync(input)
      .then(() => {
        store.getState().dispatch({ type: "saved" });
      })
      .catch(() => {
        store.getState().dispatch({ type: "failed" });
      });
  }
  function dispatch(action: EventDraftAction): void {
    const current = store.getState().state;
    if (current.phase === "collecting" && action.type !== "cancel")
      setHistory((entries) => [...entries, current.draft]);
    store.getState().dispatch(action);
    const next = store.getState().state;
    if (next.phase !== "collecting") return;
    const input = completeEventDraft(next.draft);
    if (!input) return;
    store.getState().dispatch({ type: "saving", input });
    save(input);
  }
  function handleOpenEvent(
    initial: Pick<EventDraft, "matchPlayerId" | "kind">,
  ): void {
    if (
      store.getState().state.phase !== "idle" ||
      undo.isPending ||
      controlsBusy ||
      !events.data ||
      events.isError ||
      readOnly
    )
      return;
    returnFocusTo.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setHistory([]);
    add.reset();
    dispatch({
      type: "open",
      draft: captureEventDraft(
        snapshot.match,
        initial,
        derivedState.powerplayCardEventIds[0],
      ),
    });
  }

  function retry(): void {
    const current = store.getState().state;
    if (current.phase !== "failed") return;
    store.getState().dispatch({ type: "retry" });
    save(current.input);
  }
  const disabled =
    state.phase !== "idle" ||
    controlsBusy ||
    undo.isPending ||
    !events.data ||
    events.isError;
  return (
    <div className={st.recorder} data-live-recorder={!readOnly}>
      {!readOnly && (
        <div className={st.sticky}>
          <RecorderHeader
            match={snapshot.match}
            disabled={state.phase !== "idle" || controlsBusy || undo.isPending}
            scoreDisabled={disabled}
            onScoreAdjust={() => handleOpenEvent({ kind: "score-adjustment" })}
          />
          <MatchControls
            match={snapshot.match}
            ownScore={
              events.data && !events.isError ? derivedState.ownScore : undefined
            }
            opponentScore={
              events.data && !events.isError
                ? derivedState.opponentScore
                : undefined
            }
            disabled={state.phase !== "idle" || undo.isPending}
            onBusyChange={setControlsBusy}
          />
        </div>
      )}
      {readOnly && (
        <section className={st.readOnlyScore} aria-label={t("scoreTitle")}>
          <strong>
            {snapshot.match.teamNameAtMatch}:{" "}
            {events.data && !events.isError ? derivedState.ownScore : "…"}
          </strong>
          <strong>
            {snapshot.match.opponentName}:{" "}
            {events.data && !events.isError ? derivedState.opponentScore : "…"}
          </strong>
          <p>{t("completedSummary")}</p>
          {events.data && !events.isError && (
            <p>
              {t(
                derivedState.isPowerplay
                  ? "powerplayActive"
                  : "powerplayInactive",
                {
                  maximum: String(derivedState.maxOnField),
                  queued: String(
                    Math.max(0, derivedState.powerplayCardEventIds.length - 1),
                  ),
                },
              )}
            </p>
          )}
        </section>
      )}
      <div className={readOnly ? st.summary : st.layout}>
        {!readOnly && (
          <div className={st.capture}>
            <RecorderActions
              context={context}
              disabled={disabled}
              onPick={handleOpenEvent}
              undoDisabled={
                readOnly ||
                controlsBusy ||
                !candidate.data ||
                undo.isPending ||
                state.phase !== "idle"
              }
              undoPending={undo.isPending}
              onUndo={() => {
                if (candidate.data)
                  undo.mutate({
                    matchId: snapshot.match.id,
                    eventId: candidate.data.id,
                  });
              }}
            />
            <RecorderPlayers
              context={context}
              disabled={disabled}
              onPick={handleOpenEvent}
            />
            {undo.isError && (
              <p className={st.error} role="alert">
                {t("undoFailed")}
              </p>
            )}
            {candidate.isError && (
              <p className={st.error}>{t("undoUnavailable")}</p>
            )}
          </div>
        )}
        <RecorderTimeline
          snapshot={snapshot}
          events={events.data}
          loading={events.isPending}
          failed={events.isError}
          onRetry={() => void events.refetch()}
          expanded={readOnly}
        />
      </div>
      {draft && !readOnly && (
        <EventEntryDialog
          draft={draft}
          context={context}
          phase={state.phase}
          error={add.error}
          onAction={dispatch}
          onRetry={retry}
          onBack={back}
          history={history}
        />
      )}
    </div>
  );
}
