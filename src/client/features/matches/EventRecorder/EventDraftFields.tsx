"use client";
import { useTranslations } from "next-intl";
import {
  recoverySubtypeSchema,
  lossReasonSchema,
  shotOutcomeSchema,
  cardColourSchema,
  playerEventKindSchema,
  rinkHalfSchema,
} from "../../../../domain/matches/matchEvent.schema";
import {
  getAvailableEventKinds,
  getEligiblePlayers,
  getSubstitutionDecision,
  getCardReplacementPlayers,
  getCardLineupEffect,
  getCardRemovalPlayers,
} from "../../../../domain/matches/matchRules";
import type { MatchPlayer } from "../../../../domain/matches/match.schema";
import { Button } from "@mantine/core";
import { RecorderActionIcon } from "../RecorderBoard/RecorderActionIcon";
import { ScoreCorrectionForm } from "../ScoreCorrectionForm/ScoreCorrectionForm";
import { EventTimeForm } from "../EventTimeForm/EventTimeForm";
import { Shield, Swords, Square } from "lucide-react";
import { getEventDraftSteps } from "./eventDraftSteps";
import type { EventDraftFieldsProps } from "./EventDraftFields.interfaces";
import st from "./EventDraftFields.module.css";
export function EventDraftFields({
  draft,
  context,
  durationMs,
  onAction,
}: EventDraftFieldsProps) {
  const t = useTranslations("recorder");
  const { snapshot, state } = context;
  const { ownScore, opponentScore, activePlayerIds } = state;
  function playerLabel(player: MatchPlayer): string {
    return `${player.jerseyNumber ? `#${player.jerseyNumber} · ` : ""}${player.playerNameAtMatch}`;
  }
  const step = getEventDraftSteps(draft)[0];
  const cardReplacements = draft.matchPlayerId
    ? getCardReplacementPlayers(context, draft.matchPlayerId)
    : [];
  return (
    <div className={st.fields}>
      {step === "chooseAction" && (
        <section>
          <h3>{t("chooseAction")}</h3>
          <div className={st.choices}>
            {getAvailableEventKinds(context, draft.matchPlayerId).map(
              (kind) => (
                <Button
                  key={kind}
                  variant="default"
                  leftSection={<RecorderActionIcon kind={kind} />}
                  onClick={() =>
                    onAction({
                      type: "selectKind",
                      kind,
                      selectedPlayerIsActive:
                        draft.matchPlayerId !== undefined &&
                        activePlayerIds.has(draft.matchPlayerId),
                    })
                  }
                >
                  {t(
                    kind === "substitution" && draft.matchPlayerId
                      ? activePlayerIds.has(draft.matchPlayerId)
                        ? "player-out"
                        : "substitution"
                      : kind,
                  )}
                </Button>
              ),
            )}
          </div>
        </section>
      )}
      {step === "choosePlayer" && (
        <section>
          <h3>{t("choosePlayer")}</h3>
          <ul className={st.players}>
            {(draft.kind
              ? getEligiblePlayers(
                  context,
                  playerEventKindSchema.parse(draft.kind),
                )
              : snapshot.players
            )
              .filter(
                (player) =>
                  draft.kind !== "card" ||
                  !draft.colour ||
                  getCardLineupEffect(context, player.id, draft.colour) !==
                    null,
              )
              .map((player) => (
                <li key={player.id}>
                  <Button
                    variant="default"
                    onClick={() =>
                      onAction({
                        type: "selectPlayer",
                        id: player.id,
                      })
                    }
                  >
                    <span
                      className={st.playerLabel}
                      title={playerLabel(player)}
                    >
                      {playerLabel(player)}
                    </span>
                  </Button>
                </li>
              ))}
          </ul>
        </section>
      )}
      {step === "chooseHalf" && (
        <section>
          <div className={st.choices}>
            {rinkHalfSchema.options.map((rinkHalf) => (
              <Button
                key={rinkHalf}
                variant="default"
                leftSection={
                  rinkHalf === "defensive" ? (
                    <Shield size={18} />
                  ) : (
                    <Swords size={18} />
                  )
                }
                onClick={() => onAction({ type: "selectHalf", rinkHalf })}
              >
                {t(rinkHalf)}
              </Button>
            ))}
          </div>
        </section>
      )}
      {step === "chooseSubtype" && (
        <section>
          <h3>{t("chooseSubtype")}</h3>
          <div className={st.choices}>
            {recoverySubtypeSchema.options.map((subtype) => (
              <Button
                key={subtype}
                variant="default"
                onClick={() => onAction({ type: "selectSubtype", subtype })}
              >
                {t(subtype)}
              </Button>
            ))}
          </div>
        </section>
      )}
      {step === "chooseReason" && (
        <section>
          <h3>{t("chooseReason")}</h3>
          <div className={st.choices}>
            {lossReasonSchema.options.map((reason) => (
              <Button
                key={reason}
                variant="default"
                onClick={() => onAction({ type: "selectReason", reason })}
              >
                {t(reason)}
              </Button>
            ))}
          </div>
        </section>
      )}
      {step === "chooseOutcome" && (
        <section>
          <h3>{t("chooseOutcome")}</h3>
          <div className={st.choices}>
            {shotOutcomeSchema.options.map((outcome) => (
              <Button
                key={outcome}
                variant="default"
                onClick={() => onAction({ type: "selectOutcome", outcome })}
              >
                {t(outcome)}
              </Button>
            ))}
          </div>
        </section>
      )}
      {step === "chooseColour" && (
        <section>
          <h3>{t("chooseColour")}</h3>
          <div className={st.choices}>
            {cardColourSchema.options
              .filter((colour) =>
                draft.matchPlayerId
                  ? getCardLineupEffect(
                      context,
                      draft.matchPlayerId,
                      colour,
                    ) !== null
                  : getEligiblePlayers(context, "card").some(
                      (player) =>
                        getCardLineupEffect(context, player.id, colour) !==
                        null,
                    ),
              )
              .map((colour) => (
                <Button
                  key={colour}
                  className={st.cardChoice}
                  data-card-colour={colour}
                  leftSection={
                    <Square size={18} fill="currentColor" aria-hidden="true" />
                  }
                  variant="default"
                  onClick={() => onAction({ type: "selectColour", colour })}
                >
                  {t(colour)}
                </Button>
              ))}
          </div>
        </section>
      )}
      {draft.kind === "substitution" &&
        (["outgoing", "incoming"] as const).map((side) => {
          const selected =
            side === "outgoing"
              ? draft.outgoingMatchPlayerId
              : draft.incomingMatchPlayerId;
          if (
            selected ||
            step !== (side === "outgoing" ? "chooseOutgoing" : "chooseIncoming")
          )
            return null;
          const options = snapshot.players.filter((player) =>
            side === "outgoing"
              ? activePlayerIds.has(player.id) &&
                (draft.incomingMatchPlayerId
                  ? getSubstitutionDecision(
                      context,
                      player.id,
                      draft.incomingMatchPlayerId,
                    ).allowed
                  : getEligiblePlayers(context, "substitution").some(
                      (entry) => entry.id === player.id,
                    ))
              : !activePlayerIds.has(player.id) &&
                (draft.outgoingMatchPlayerId
                  ? getSubstitutionDecision(
                      context,
                      draft.outgoingMatchPlayerId,
                      player.id,
                    ).allowed
                  : getEligiblePlayers(context, "substitution").some(
                      (entry) => entry.id === player.id,
                    )),
          );
          return (
            <section key={side}>
              <h3>
                {t(side === "outgoing" ? "chooseOutgoing" : "chooseIncoming")}
              </h3>
              <div className={st.choices}>
                {options.map((player) => (
                  <Button
                    key={player.id}
                    variant="default"
                    onClick={() =>
                      onAction({
                        type: "selectSubstitute",
                        side,
                        id: player.id,
                      })
                    }
                  >
                    <span
                      className={st.playerLabel}
                      title={playerLabel(player)}
                    >
                      {playerLabel(player)}
                    </span>
                  </Button>
                ))}
              </div>
            </section>
          );
        })}
      {step === "confirmCard" &&
        draft.kind === "card" &&
        draft.colour &&
        draft.matchPlayerId &&
        draft.lineupEffect === undefined && (
          <section>
            {draft.colour === "blue" &&
              (state.blueCardCounts.get(draft.matchPlayerId) ?? 0) >= 2 && (
                <p>{t("thirdBlueRed")}</p>
              )}
            {getCardLineupEffect(context, draft.matchPlayerId, draft.colour) ===
            "none" ? (
              <>
                <p>
                  {t(
                    draft.colour === "yellow"
                      ? "cardNoLineupChange"
                      : "cardQueuesPowerplay",
                  )}
                </p>
                <Button
                  onClick={() =>
                    onAction({ type: "confirmCard", effect: "none" })
                  }
                >
                  {t("confirmCard")}
                </Button>
              </>
            ) : getCardLineupEffect(
                context,
                draft.matchPlayerId,
                draft.colour,
              ) === "remove" ? (
              <>
                <p>
                  {t(
                    activePlayerIds.has(draft.matchPlayerId)
                      ? "cardRemovesPlayer"
                      : "choosePowerplayRemoval",
                  )}
                </p>
                <div className={st.choices}>
                  {getCardRemovalPlayers(context, draft.matchPlayerId).map(
                    (player) => (
                      <Button
                        key={player.id}
                        onClick={() =>
                          onAction({
                            type: "confirmCard",
                            effect: "remove",
                            removedId: player.id,
                          })
                        }
                      >
                        {activePlayerIds.has(draft.matchPlayerId!)
                          ? t("confirmCard")
                          : playerLabel(player)}
                      </Button>
                    ),
                  )}
                </div>
              </>
            ) : (
              <>
                <p>{t("cardNeedsReplacement")}</p>
                <p>{t("cardQueuesPowerplay")}</p>
                <div className={st.choices}>
                  {cardReplacements.map((player) => (
                    <Button
                      key={player.id}
                      onClick={() =>
                        onAction({
                          type: "confirmCard",
                          effect: "replace",
                          replacementId: player.id,
                        })
                      }
                    >
                      <span
                        className={st.playerLabel}
                        title={playerLabel(player)}
                      >
                        {playerLabel(player)}
                      </span>
                    </Button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      {step === "confirmPowerplayEnd" && (
        <section>
          <p>
            {t(
              state.powerplayCardEventIds.length > 1
                ? "powerplayContinues"
                : "powerplayEnds",
            )}
          </p>
          <Button
            onClick={() => {
              const cardEventId = draft.powerplayCardEventId;
              if (cardEventId)
                onAction({ type: "confirmPowerplayEnd", cardEventId });
            }}
          >
            {t("confirmPowerplayEnd")}
          </Button>
        </section>
      )}
      {step === "eventTimeRequired" && (
        <EventTimeForm
          durationMs={durationMs}
          onApply={(elapsedMs) => onAction({ type: "setTime", elapsedMs })}
        />
      )}
      {step === "saveScore" && (
        <ScoreCorrectionForm
          ownName={snapshot.match.teamNameAtMatch}
          opponentName={snapshot.match.opponentName}
          ownScore={ownScore}
          opponentScore={opponentScore}
          onApply={(opponentDelta) =>
            onAction({ type: "setScoreAdjustment", ownDelta: 0, opponentDelta })
          }
        />
      )}
    </div>
  );
}
