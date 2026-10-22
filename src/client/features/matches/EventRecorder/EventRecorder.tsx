"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "zustand";
import { useTranslations } from "next-intl";
import type {
  AddMatchEventInput,
  RinkPosition,
} from "../../../../domain/matches/matchEvent.schema";
import { toTeamPosition } from "../../../../domain/matches/rinkPosition";
import type { RinkAttackDirection } from "../../../../domain/matches/rinkPosition";
import { RecorderRink } from "../RecorderRink/RecorderRink";
import { getClockElapsed } from "../../../../domain/matches/matchControl";
import { getAvailableEventKinds } from "../../../../domain/matches/matchRules";
import type { PowerplayPenalty } from "../../../../domain/matches/powerplay";
import { PowerplayCorrectionDialog } from "../PowerplayCorrectionDialog/PowerplayCorrectionDialog";
import { deriveMatchState } from "../../../../domain/matches/derivedMatchState";
import { MatchControls } from "../MatchControls/MatchControls";
import { MatchScoreboard } from "../MatchScoreboard/MatchScoreboard";
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
  const state = useStore(store, (entry) => entry.state);
  const [controlsBusy, setControlsBusy] = useState(false);
  const [rinkPicking, setRinkPicking] = useState(false);
  const [rinkGesture, setRinkGesture] = useState(false);
  const [rinkElapsedMs, setRinkElapsedMs] = useState<number>();
  const [rinkDirection, setRinkDirection] = useState<RinkAttackDirection>();
  const pendingRink = useRef<{
    draft: EventDraft;
    direction: RinkAttackDirection;
  } | null>(null);
  const [correction, setCorrection] = useState<
    readonly PowerplayPenalty[] | null
  >(null);
  const [now, setNow] = useState(Date.now);
  const promptedPenalty = useRef<string | undefined>(undefined);
  const readOnly = snapshot.match.status !== "live";
  const events = useMatchEvents(snapshot.match.id);
  const candidate = useLatestUndoEvent(snapshot.match.id);
  const elapsedMs = getClockElapsed(snapshot.match, now);
  const derivedState = deriveMatchState(snapshot, events.data ?? [], {
    period: snapshot.match.currentPeriod,
    gameTime: elapsedMs === undefined ? undefined : { elapsedMs },
  });
  const context = { snapshot, state: derivedState };
  const add = useAddMatchEvent();
  const undo = useUndoMatchEvent();
  const draft = state.phase === "idle" ? null : state.draft;
  const storedDirection = snapshot.match.periods.find(
    (period) =>
      period.number === (draft?.period ?? snapshot.match.currentPeriod),
  )?.attackDirection;
  const currentDirection =
    storedDirection === "toward-x0" || storedDirection === "toward-x1"
      ? storedDirection
      : undefined;
  const selectedDirection = draft?.position
    ? (rinkDirection ?? currentDirection)
    : currentDirection;
  const draftContext = draft
    ? { snapshot, state: deriveMatchState(snapshot, events.data ?? [], draft) }
    : context;
  useEffect(() => {
    if (readOnly || snapshot.match.clock?.runningSince === undefined) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [readOnly, snapshot.match.clock?.runningSince]);
  const canEnter = getAvailableEventKinds(context).includes("player-in");
  const lastPenalty = derivedState.lastPowerplayEndCardEventId;
  useEffect(() => {
    if (derivedState.isPowerplay) {
      promptedPenalty.current = undefined;
      return;
    }
    if (
      !lastPenalty ||
      promptedPenalty.current === lastPenalty ||
      !canEnter ||
      !derivedState.valid ||
      readOnly ||
      state.phase !== "idle" ||
      controlsBusy ||
      rinkPicking ||
      rinkGesture ||
      correction ||
      undo.isPending ||
      !events.data ||
      events.isError
    )
      return;
    promptedPenalty.current = lastPenalty;
    returnFocusTo.current = document.getElementById("recorder-players");
    add.reset();
    store.getState().dispatch({
      type: "open",
      draft: captureEventDraft(snapshot.match, { kind: "player-in" }),
    });
  }, [
    lastPenalty,
    canEnter,
    derivedState.valid,
    derivedState.isPowerplay,
    readOnly,
    state.phase,
    controlsBusy,
    rinkPicking,
    rinkGesture,
    correction,
    undo.isPending,
    events.data,
    events.isError,
    add,
    store,
    snapshot.match,
  ]);
  useEffect(() => {
    if (
      state.phase !== "idle" ||
      rinkPicking ||
      rinkGesture ||
      store.getState().state.phase !== "idle" ||
      !returnFocusTo.current
    )
      return;
    const trigger = returnFocusTo.current;
    returnFocusTo.current = null;
    const frame = window.requestAnimationFrame(() => {
      if (trigger.isConnected) trigger.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state.phase, store, rinkPicking, rinkGesture]);
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
    if (action.type === "cancel") {
      pendingRink.current = null;
      setRinkPicking(false);
      setRinkGesture(false);
    }
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
      rinkPicking ||
      rinkGesture ||
      correction !== null ||
      !events.data ||
      events.isError ||
      readOnly
    )
      return;
    returnFocusTo.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    add.reset();
    setRinkDirection(undefined);
    dispatch({
      type: "open",
      draft: captureEventDraft(
        snapshot.match,
        initial,
        derivedState.powerplayCardEventIds[0],
      ),
    });
  }

  function openRink(): void {
    if (disabled || controlsBusy || readOnly) return;
    returnFocusTo.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    add.reset();
    setRinkPicking(true);
  }

  function startRinkGesture(): void {
    if (
      draft ||
      !currentDirection ||
      readOnly ||
      controlsBusy ||
      undo.isPending ||
      !events.data ||
      events.isError
    )
      return;
    if (!pendingRink.current) {
      pendingRink.current = {
        draft: captureEventDraft(snapshot.match, {}),
        direction: currentDirection,
      };
      if (!rinkPicking)
        returnFocusTo.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
    }
    setRinkElapsedMs(pendingRink.current.draft.gameTime?.elapsedMs);
    setRinkGesture(true);
  }

  function cancelRinkGesture(): void {
    pendingRink.current = null;
    setRinkGesture(false);
  }

  function selectRinkPosition(point: RinkPosition): void {
    if (draft) {
      if (state.phase !== "collecting" || !selectedDirection) return;
      dispatch({
        type: "setPosition",
        position: toTeamPosition(point, selectedDirection),
      });
    } else {
      const captured = pendingRink.current;
      if (!captured || store.getState().state.phase !== "idle") return;
      add.reset();
      setRinkDirection(captured.direction);
      dispatch({
        type: "open",
        draft: {
          ...captured.draft,
          position: toTeamPosition(point, captured.direction),
        },
      });
    }
    pendingRink.current = null;
    setRinkGesture(false);
    setRinkPicking(false);
  }

  function retry(): void {
    const current = store.getState().state;
    if (current.phase !== "failed") return;
    store.getState().dispatch({ type: "retry" });
    save(current.input);
  }
  const disabled =
    state.phase !== "idle" ||
    rinkPicking ||
    rinkGesture ||
    correction !== null ||
    undo.isPending ||
    !events.data ||
    events.isError;
  const rinkProps = {
    match: snapshot.match,
    inert: controlsBusy,
    period: draft?.period ?? snapshot.match.currentPeriod,
    direction: selectedDirection,
    position: draft?.position,
    disabled:
      state.phase !== "idle" ||
      rinkPicking ||
      correction !== null ||
      undo.isPending ||
      !events.data ||
      events.isError,
    onOpen: openRink,
    onStart: startRinkGesture,
    onSelect: selectRinkPosition,
    onCancelGesture: cancelRinkGesture,
  };
  return (
    <div className={st.recorder} data-live-recorder={!readOnly}>
      {!readOnly && (
        <div className={st.board}>
          <div className={st.sticky} inert={controlsBusy}>
            <RecorderHeader
              match={snapshot.match}
              disabled={
                state.phase !== "idle" ||
                rinkPicking ||
                rinkGesture ||
                correction !== null ||
                undo.isPending
              }
              scoreDisabled={disabled}
              onScoreAdjust={() =>
                handleOpenEvent({ kind: "score-adjustment" })
              }
            />
            <MatchScoreboard
              match={snapshot.match}
              now={now}
              powerplays={
                events.data && !events.isError ? derivedState.powerplays : []
              }
              onCorrectPowerplay={() => setCorrection(derivedState.powerplays)}
              ownScore={
                events.data && !events.isError
                  ? derivedState.ownScore
                  : undefined
              }
              opponentScore={
                events.data && !events.isError
                  ? derivedState.opponentScore
                  : undefined
              }
              disabled={disabled}
            />
          </div>
          <MatchControls
            match={snapshot.match}
            now={now}
            disabled={
              state.phase !== "idle" ||
              rinkPicking ||
              rinkGesture ||
              correction !== null ||
              undo.isPending
            }
            onBusyChange={setControlsBusy}
          />
          <div className={st.capture} inert={controlsBusy}>
            <RecorderActions
              context={context}
              disabled={disabled}
              onPick={handleOpenEvent}
              undoDisabled={
                readOnly ||
                rinkPicking ||
                rinkGesture ||
                correction !== null ||
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
            <RecorderRink {...rinkProps} presentation="compact" />
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
      <div className={st.review}>
        {!readOnly && <RecorderRink {...rinkProps} presentation="desktop" />}
        <RecorderTimeline
          snapshot={snapshot}
          events={events.data}
          loading={events.isPending}
          failed={events.isError}
          onRetry={() => void events.refetch()}
          expanded={readOnly}
          scrollable={!readOnly}
        />
      </div>
      {correction && !readOnly && (
        <PowerplayCorrectionDialog
          match={snapshot.match}
          penalties={correction}
          onClose={() => setCorrection(null)}
        />
      )}
      {(draft || rinkPicking) && !readOnly && (
        <EventEntryDialog
          draft={draft}
          context={draftContext}
          phase={state.phase}
          error={add.error}
          onAction={dispatch}
          onRetry={retry}
          liveElapsedMs={rinkGesture ? rinkElapsedMs : elapsedMs}
          rink={{
            picking: rinkPicking,
            direction: selectedDirection,
            onStart: startRinkGesture,
            onSelect: selectRinkPosition,
            onCancelGesture: cancelRinkGesture,
            onEdit: () => setRinkPicking(true),
          }}
        />
      )}
    </div>
  );
}
