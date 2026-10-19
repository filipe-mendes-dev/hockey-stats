"use client";
import { useState } from "react";
import { useStore } from "zustand";
import { useTranslations } from "next-intl";
import type { AddMatchEventInput } from "../../../../domain/matches/matchEvent.schema";
import { recoverySubtypeSchema } from "../../../../domain/matches/matchEvent.schema";
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
import { createEventDraftStore } from "./eventDraft.store";
import { completeEventDraft } from "./eventDraft";
import type { EventDraft, EventDraftAction } from "./eventDraft";
import type { EventRecorderProps } from "./EventRecorder.interfaces";
import st from "./EventRecorder.module.css";
function formatElapsed(elapsedMs: number): string {
  return `${String(Math.floor(elapsedMs / 60_000)).padStart(2, "0")}:${String(Math.floor(elapsedMs / 1000) % 60).padStart(2, "0")}`;
}
export function EventRecorder({ snapshot }: EventRecorderProps) {
  const t = useTranslations("recorder");
  const assignment = useTranslations("teamPlayers");
  const [store] = useState(createEventDraftStore);
  const [returnFocusTo, setReturnFocusTo] = useState<HTMLElement | null>(null);
  const state = useStore(store, (entry) => entry.state);
  const [period, setPeriod] = useState(snapshot.match.periods[0]?.number ?? 1);
  const events = useMatchEvents(snapshot.match.id);
  const candidate = useLatestUndoEvent(snapshot.match.id);
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
  function open(initial: Pick<EventDraft, "matchPlayerId" | "kind">): void {
    if (store.getState().state.phase !== "idle" || undo.isPending) return;
    setReturnFocusTo(
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null,
    );
    add.reset();
    dispatch({
      type: "open",
      draft: {
        id: crypto.randomUUID(),
        operationId: crypto.randomUUID(),
        matchId: snapshot.match.id,
        period,
        capturedAt: Date.now(),
        ...initial,
      },
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
      <div className={st.toolbar}>
        <label className={st.period}>
          {t("period")}
          <select
            value={period}
            disabled={state.phase !== "idle"}
            onChange={(event) => setPeriod(Number(event.target.value))}
          >
            {snapshot.match.periods.map((entry) => (
              <option key={entry.number} value={entry.number}>
                {t("periodNumber", { number: entry.number })}
              </option>
            ))}
          </select>
        </label>
        <p>{t("clockUnavailable")}</p>
      </div>
      <div className={st.layout}>
        <div className={st.controls}>
          <section aria-labelledby="recorder-actions">
            <h2 id="recorder-actions">{t("actions")}</h2>
            <Button
              disabled={state.phase !== "idle" || undo.isPending}
              onClick={() => open({ kind: "ball-recovery" })}
            >
              {t("ball-recovery")}
            </Button>
          </section>
          {([true, false] as const).map((starting) => (
            <section key={String(starting)}>
              <h2>{t(starting ? "onField" : "bench")}</h2>
              <ul className={st.players}>
                {snapshot.players
                  .filter((player) => player.isStarter === starting)
                  .map((player) => (
                    <li key={player.id}>
                      <Button
                        variant="secondary"
                        disabled={state.phase !== "idle" || undo.isPending}
                        onClick={() => open({ matchPlayerId: player.id })}
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
        <section className={st.timeline} aria-labelledby="recorder-timeline">
          <h2 id="recorder-timeline">{t("timeline")}</h2>
          <Button
            variant="secondary"
            disabled={
              !candidate.data || undo.isPending || state.phase !== "idle"
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
                          {snapshot.players.find(
                            (player) => player.id === event.matchPlayerId,
                          )?.playerNameAtMatch ?? t("playerUnavailable")}
                        </strong>
                        <span>
                          {t("eventSummary", {
                            kind: t(event.kind),
                            detail: t(event.subtype),
                          })}
                        </span>
                        <span>
                          {t("eventTime", {
                            period: event.period,
                            time: event.gameTime
                              ? formatElapsed(event.gameTime.elapsedMs)
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
      {draft && (
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
                  ? formatElapsed(draft.gameTime.elapsedMs)
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
            {state.phase === "collecting" && (
              <>
                {!draft.kind && (
                  <section>
                    <h3>{t("chooseAction")}</h3>
                    <Button
                      onClick={() =>
                        dispatch({ type: "selectKind", kind: "ball-recovery" })
                      }
                    >
                      {t("ball-recovery")}
                    </Button>
                  </section>
                )}
                {!draft.matchPlayerId && (
                  <section>
                    <h3>{t("choosePlayer")}</h3>
                    <ul className={st.players}>
                      {snapshot.players.map((player) => (
                        <li key={player.id}>
                          <Button
                            variant="secondary"
                            onClick={() =>
                              dispatch({ type: "selectPlayer", id: player.id })
                            }
                          >
                            {player.jerseyNumber
                              ? `#${player.jerseyNumber} · `
                              : ""}
                            {player.playerNameAtMatch}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {draft.kind === "ball-recovery" && !draft.subtype && (
                  <section>
                    <h3>{t("chooseSubtype")}</h3>
                    <div className={st.choices}>
                      {recoverySubtypeSchema.options.map((subtype) => (
                        <Button
                          key={subtype}
                          variant="secondary"
                          onClick={() =>
                            dispatch({ type: "selectSubtype", subtype })
                          }
                        >
                          {t(subtype)}
                        </Button>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
            {state.phase === "saving" && <p role="status">{t("saving")}</p>}
            {state.phase === "failed" && (
              <>
                <p className={st.error} role="alert">
                  {t(
                    add.error instanceof MatchEventUnavailableError
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
