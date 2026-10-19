"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  recoverySubtypeSchema,
  lossReasonSchema,
  shotOutcomeSchema,
  cardColourSchema,
  playerEventKindSchema,
} from "../../../../domain/matches/matchEvent.schema";
import type { MatchEventKind } from "../../../../domain/matches/matchEvent.schema";
import { Button } from "../../../components/Button/Button";
import type { EventDraftFieldsProps } from "./EventDraftFields.interfaces";
import st from "./EventDraftFields.module.css";
export function EventDraftFields({
  draft,
  players,
  activePlayerIds,
  ownScore,
  opponentScore,
  durationMs,
  onAction,
}: EventDraftFieldsProps) {
  const t = useTranslations("recorder");
  const [error, setError] = useState<
    "scoreNoChange" | "timeOutsidePeriod" | null
  >(null);
  function isAvailable(kind: MatchEventKind, playerId?: string): boolean {
    if (kind === "player-in" && playerId) return !activePlayerIds.has(playerId);
    if (kind === "player-out" && playerId) return activePlayerIds.has(playerId);
    return true;
  }
  return (
    <div className={st.fields}>
      {!draft.kind && (
        <section>
          <h3>{t("chooseAction")}</h3>
          <div className={st.choices}>
            {playerEventKindSchema.options.map((kind) => (
              <Button
                key={kind}
                disabled={!isAvailable(kind, draft.matchPlayerId)}
                onClick={() => onAction({ type: "selectKind", kind })}
              >
                {t(kind)}
              </Button>
            ))}
          </div>
        </section>
      )}
      {!draft.matchPlayerId &&
        draft.kind !== "opponent-goal" &&
        draft.kind !== "score-adjustment" && (
          <section>
            <h3>{t("choosePlayer")}</h3>
            <ul className={st.players}>
              {players.map((player) => (
                <li key={player.id}>
                  <Button
                    variant="secondary"
                    disabled={
                      draft.kind !== undefined &&
                      !isAvailable(draft.kind, player.id)
                    }
                    onClick={() =>
                      onAction({
                        type: "selectPlayer",
                        id: player.id,
                      })
                    }
                  >
                    {player.jerseyNumber ? `#${player.jerseyNumber} · ` : ""}
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
                onClick={() => onAction({ type: "selectSubtype", subtype })}
              >
                {t(subtype)}
              </Button>
            ))}
          </div>
        </section>
      )}
      {draft.kind === "ball-loss" && !draft.reason && (
        <section>
          <h3>{t("chooseReason")}</h3>
          <div className={st.choices}>
            {lossReasonSchema.options.map((reason) => (
              <Button
                key={reason}
                variant="secondary"
                onClick={() => onAction({ type: "selectReason", reason })}
              >
                {t(reason)}
              </Button>
            ))}
          </div>
        </section>
      )}
      {draft.kind === "shot" && !draft.outcome && (
        <section>
          <h3>{t("chooseOutcome")}</h3>
          <div className={st.choices}>
            {shotOutcomeSchema.options.map((outcome) => (
              <Button
                key={outcome}
                variant="secondary"
                onClick={() => onAction({ type: "selectOutcome", outcome })}
              >
                {t(outcome)}
              </Button>
            ))}
          </div>
        </section>
      )}
      {draft.kind === "card" && !draft.colour && (
        <section>
          <h3>{t("chooseColour")}</h3>
          <div className={st.choices}>
            {cardColourSchema.options.map((colour) => (
              <Button
                key={colour}
                variant="secondary"
                onClick={() => onAction({ type: "selectColour", colour })}
              >
                {t(colour)}
              </Button>
            ))}
          </div>
        </section>
      )}
      {(draft.kind === "player-in" || draft.kind === "player-out") &&
        !draft.gameTime && (
          <form
            className={st.fields}
            action={(data) => {
              const minutes = Number(data.get("minutes"));
              const seconds = Number(data.get("seconds"));
              setError(null);
              if (
                durationMs !== undefined &&
                minutes * 60_000 + seconds * 1000 > durationMs
              ) {
                setError("timeOutsidePeriod");
                return;
              }
              if (
                Number.isInteger(minutes) &&
                minutes >= 0 &&
                Number.isInteger(seconds) &&
                seconds >= 0 &&
                seconds < 60
              )
                onAction({
                  type: "setTime",
                  elapsedMs: minutes * 60_000 + seconds * 1000,
                });
            }}
          >
            <p>{t("movementTimeRequired")}</p>
            <label>
              {t("minutes")}
              <input name="minutes" type="number" min="0" step="1" required />
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
              />
            </label>
            <Button type="submit">{t("useTime")}</Button>
          </form>
        )}
      {draft.kind === "score-adjustment" && (
        <form
          className={st.fields}
          action={(data) => {
            const ownDelta = Number(data.get("ownDelta"));
            const opponentDelta = Number(data.get("opponentDelta"));
            setError(null);
            if (ownDelta === 0 && opponentDelta === 0) {
              setError("scoreNoChange");
              return;
            }
            if (
              Number.isInteger(ownDelta) &&
              Number.isInteger(opponentDelta) &&
              (ownDelta !== 0 || opponentDelta !== 0)
            )
              onAction({
                type: "setScoreAdjustment",
                ownDelta,
                opponentDelta,
              });
          }}
        >
          <p>{t("scoreAdjustmentHelp")}</p>
          <label>
            {t("ourScoreChange")}
            <input
              name="ownDelta"
              type="number"
              min={Math.max(-ownScore, -2147483648)}
              max="2147483647"
              step="1"
              required
              defaultValue="0"
            />
          </label>
          <label>
            {t("opponentScoreChange")}
            <input
              name="opponentDelta"
              type="number"
              min={Math.max(-opponentScore, -2147483648)}
              max="2147483647"
              step="1"
              required
              defaultValue="0"
            />
          </label>
          <Button type="submit">{t("saveScore")}</Button>
        </form>
      )}
      {error && (
        <p className={st.error} role="alert">
          {t(error)}
        </p>
      )}
    </div>
  );
}
