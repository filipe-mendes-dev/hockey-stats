"use client";
import { useState } from "react";
import { useStore } from "zustand";
import { useTranslations } from "next-intl";
import type { AddMatchEventInput } from "../../../../domain/matches/matchEvent.schema";
import { getEventDetail } from "../../../../domain/matches/matchEvent.schema";
import {
  getAvailableEventKinds,
  MatchRuleError,
} from "../../../../domain/matches/matchRules";
import { deriveMatchState } from "../../../../domain/matches/derivedMatchState";
import { formatMatchTime } from "../../../../domain/matches/matchControl";
import { MatchControls } from "../MatchControls/MatchControls";
import { Button } from "../../../components/Button/Button";
import { Modal } from "../../../components/Modal/Modal";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { DeliveryStatus } from "../../sync/DeliveryStatus/DeliveryStatus";
import {
  useMatchEvents,
  useLatestUndoEvent,
} from "../queries/matchEvents.queries";
import {
  useAddMatchEvent,
  useUndoMatchEvent,
} from "../mutations/matchEvents.mutations";
import { MatchEventUnavailableError } from "../matchEvents.service";
import { EventDraftFields } from "./EventDraftFields";
import { createEventDraftStore } from "./eventDraft.store";
import { completeEventDraft, captureEventDraft } from "./eventDraft";
import type { EventDraft, EventDraftAction } from "./eventDraft";
import type { EventRecorderProps } from "./EventRecorder.interfaces";
import st from "./EventRecorder.module.css";
export function EventRecorder({ snapshot }: EventRecorderProps) {
  const t = useTranslations("recorder");
  const assignment = useTranslations("teamPlayers");
  const [store] = useState(createEventDraftStore);
  const [returnFocusTo, setReturnFocusTo] = useState<HTMLElement | null>(null);
  const state = useStore(store, (entry) => entry.state);
  const [controlsBusy, setControlsBusy] = useState(false);
  const readOnly = snapshot.match.status !== "live";
  const events = useMatchEvents(snapshot.match.id);
  const candidate = useLatestUndoEvent(snapshot.match.id);
  const derivedState = deriveMatchState(snapshot, events.data ?? []);
  const context = { snapshot, state: derivedState };
  const add = useAddMatchEvent();
  const undo = useUndoMatchEvent();
  const locked = state.phase === "saving";
  const draft = state.phase === "idle" ? null : state.draft;
  const selectedPlayer = snapshot.players.find(
    (player) => player.id === draft?.matchPlayerId,
  );
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
    setReturnFocusTo(
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null,
    );
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
  return (
    <div className={st.recorder}>
      <MatchControls
        match={snapshot.match}
        disabled={state.phase !== "idle" || undo.isPending}
        onBusyChange={setControlsBusy}
      />
      <section aria-label={t("scoreTitle")} className={st.score}>
        <strong>
          {snapshot.match.teamNameAtMatch}:{" "}
          {events.data && !events.isError ? derivedState.ownScore : "…"}
        </strong>
        <strong>
          {snapshot.match.opponentName}:{" "}
          {events.data && !events.isError ? derivedState.opponentScore : "…"}
        </strong>
        {!readOnly && (
          <div className={st.choices}>
            <Button
              disabled={
                state.phase !== "idle" ||
                controlsBusy ||
                undo.isPending ||
                !events.data ||
                events.isError
              }
              onClick={() => handleOpenEvent({ kind: "opponent-goal" })}
            >
              {t("opponent-goal")}
            </Button>
            <Button
              variant="secondary"
              disabled={
                state.phase !== "idle" ||
                controlsBusy ||
                undo.isPending ||
                !events.data ||
                events.isError
              }
              onClick={() => handleOpenEvent({ kind: "score-adjustment" })}
            >
              {t("score-adjustment")}
            </Button>
          </div>
        )}
      </section>
      {events.data && !events.isError && (
        <section aria-label={t("powerplayTitle")} className={st.score}>
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
          {!readOnly && derivedState.isPowerplay && (
            <Button
              variant="secondary"
              disabled={
                state.phase !== "idle" ||
                undo.isPending ||
                controlsBusy ||
                !events.data ||
                events.isError
              }
              onClick={() => handleOpenEvent({ kind: "powerplay-end" })}
            >
              {t("powerplay-end")}
            </Button>
          )}
        </section>
      )}
      {readOnly && <p>{t("completedSummary")}</p>}
      <div className={readOnly ? st.recorder : st.layout}>
        {!readOnly && (
          <div className={st.controls}>
            <section aria-labelledby="recorder-actions">
              <h2 id="recorder-actions">{t("actions")}</h2>
              <div className={st.choices}>
                {getAvailableEventKinds(context).map((kind) => (
                  <Button
                    key={kind}
                    disabled={
                      state.phase !== "idle" ||
                      undo.isPending ||
                      controlsBusy ||
                      !events.data ||
                      events.isError
                    }
                    onClick={() => handleOpenEvent({ kind })}
                  >
                    {t(kind)}
                  </Button>
                ))}
              </div>
            </section>
            {([true, false] as const).map((starting) => (
              <section key={String(starting)}>
                <h2>{t(starting ? "onField" : "bench")}</h2>
                <ul className={st.players}>
                  {snapshot.players
                    .filter(
                      (player) =>
                        derivedState.activePlayerIds.has(player.id) ===
                          starting &&
                        getAvailableEventKinds(context, player.id).length > 0,
                    )
                    .map((player) => (
                      <li key={player.id}>
                        <Button
                          variant="secondary"
                          disabled={
                            state.phase !== "idle" ||
                            undo.isPending ||
                            controlsBusy ||
                            readOnly
                          }
                          onClick={() =>
                            handleOpenEvent({ matchPlayerId: player.id })
                          }
                        >
                          <strong>
                            {player.jerseyNumber
                              ? `#${player.jerseyNumber} · `
                              : ""}
                            {player.playerNameAtMatch}
                          </strong>
                          <span>{assignment(player.role)}</span>
                        </Button>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        )}
        <section className={st.timeline} aria-labelledby="recorder-timeline">
          <h2 id="recorder-timeline">{t("timeline")}</h2>
          {!readOnly && (
            <Button
              variant="secondary"
              disabled={
                readOnly ||
                controlsBusy ||
                !candidate.data ||
                undo.isPending ||
                state.phase !== "idle"
              }
              onClick={() => {
                if (candidate.data)
                  undo.mutate({
                    matchId: snapshot.match.id,
                    eventId: candidate.data.id,
                  });
              }}
            >
              {t(undo.isPending ? "undoing" : "undo")}
            </Button>
          )}
          {undo.isError && (
            <p className={st.error} role="alert">
              {t("undoFailed")}
            </p>
          )}
          {candidate.isError && (
            <p className={st.error}>{t("undoUnavailable")}</p>
          )}
          {events.isPending || events.isError ? (
            <EntityDataStatus
              loadingLabel={t("loading")}
              failedLabel={t("loadFailed")}
              retryLabel={t("retry")}
              failed={events.isError}
              onRetry={() => {
                void events.refetch();
              }}
            />
          ) : (
            <>
              <p className={st.visuallyHidden} role="status">
                {t("eventCount", {
                  count: events.data.filter((event) => !event.deletedAt).length,
                })}
              </p>
              {events.data.every((event) => event.deletedAt !== undefined) ? (
                <p>{t("empty")}</p>
              ) : (
                <ol className={st.events}>
                  {[...events.data]
                    .reverse()
                    .filter((event) => event.deletedAt === undefined)
                    .map((event) => (
                      <li key={event.id}>
                        <strong>
                          {event.kind === "substitution"
                            ? t("substitutionPlayers", {
                                outgoing:
                                  snapshot.players.find(
                                    (player) =>
                                      player.id === event.outgoingMatchPlayerId,
                                  )?.playerNameAtMatch ??
                                  t("playerUnavailable"),
                                incoming:
                                  snapshot.players.find(
                                    (player) =>
                                      player.id === event.incomingMatchPlayerId,
                                  )?.playerNameAtMatch ??
                                  t("playerUnavailable"),
                              })
                            : "matchPlayerId" in event
                              ? (snapshot.players.find(
                                  (player) => player.id === event.matchPlayerId,
                                )?.playerNameAtMatch ?? t("playerUnavailable"))
                              : t("matchLevelEvent")}
                        </strong>
                        <span>
                          {t("eventSummary", {
                            kind: t(event.kind),
                            detail: getEventDetail(event)
                              ? t(getEventDetail(event)!)
                              : event.kind === "score-adjustment"
                                ? t("scoreChange", {
                                    own: event.ownDelta,
                                    opponent: event.opponentDelta,
                                  })
                                : "",
                          })}
                        </span>
                        {event.kind === "card" &&
                          event.removedMatchPlayerId && (
                            <span>
                              {t("outgoingPlayer", {
                                name:
                                  snapshot.players.find(
                                    (player) =>
                                      player.id === event.removedMatchPlayerId,
                                  )?.playerNameAtMatch ??
                                  t("playerUnavailable"),
                              })}
                            </span>
                          )}
                        {event.kind === "card" &&
                          event.colour === "blue" &&
                          event.startsPowerplay &&
                          (deriveMatchState(
                            snapshot,
                            events.data.filter(
                              (entry) => entry.order <= event.order,
                            ),
                          ).blueCardCounts.get(event.matchPlayerId) ?? 0) >=
                            3 && <span>{t("thirdBlueRed")}</span>}
                        {event.kind === "card" &&
                          event.lineupEffect === "replace" && (
                            <span>
                              {t("incomingPlayer", {
                                name:
                                  snapshot.players.find(
                                    (player) =>
                                      player.id ===
                                      event.replacementMatchPlayerId,
                                  )?.playerNameAtMatch ??
                                  t("playerUnavailable"),
                              })}
                            </span>
                          )}
                        <span>
                          {t("eventTime", {
                            period: event.period,
                            time: event.gameTime
                              ? formatMatchTime(event.gameTime.elapsedMs)
                              : t("untimed"),
                          })}
                        </span>
                        <DeliveryStatus
                          kind="matchEvent.create"
                          entityId={snapshot.match.id}
                          eventId={event.id}
                        />
                      </li>
                    ))}
                </ol>
              )}
            </>
          )}
        </section>
      </div>
      {draft && !readOnly && (
        <Modal
          title={t("newEvent")}
          locked={locked}
          returnFocusTo={returnFocusTo}
          onDismiss={() => dispatch({ type: "cancel" })}
        >
          <div className={st.modalContent}>
            <p>
              {t("eventTime", {
                period: draft.period,
                time: draft.gameTime
                  ? formatMatchTime(draft.gameTime.elapsedMs)
                  : t("untimed"),
              })}
            </p>
            {selectedPlayer && (
              <p>
                {t("selectedPlayer", {
                  name: selectedPlayer.playerNameAtMatch,
                })}
              </p>
            )}
            {draft.kind && <p>{t(draft.kind)}</p>}
            {draft.subtype && <p>{t(draft.subtype)}</p>}
            {draft.colour && <p>{t(draft.colour)}</p>}
            {state.phase === "collecting" && (
              <EventDraftFields
                draft={draft}
                context={context}
                durationMs={
                  snapshot.match.periods.find(
                    (period) => period.number === draft.period,
                  )?.durationMs
                }
                onAction={dispatch}
              />
            )}
            {state.phase === "saving" && <p role="status">{t("saving")}</p>}
            {state.phase === "failed" && (
              <>
                <p className={st.error} role="alert">
                  {t(
                    add.error instanceof MatchRuleError
                      ? `rules.${add.error.reason}`
                      : add.error instanceof MatchEventUnavailableError
                        ? "changed"
                        : "saveFailed",
                  )}
                </p>
                <Button onClick={retry}>{t("retry")}</Button>
              </>
            )}
            <Button
              variant="secondary"
              disabled={locked}
              onClick={() => dispatch({ type: "cancel" })}
            >
              {t("cancel")}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
