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
import { Button } from "@mantine/core";
import { RecorderActionIcon } from "../RecorderBoard/RecorderActionIcon";
import { EventTimeForm } from "../EventTimeForm/EventTimeForm";
import {
  Shield,
  Swords,
  Square,
  Trophy,
  Target,
  MoveUpRight,
  ShieldCheck,
  Crosshair,
  Timer,
  Hand,
  ArrowLeftRight,
  CircleDot,
  CircleEllipsis,
  UserRoundX,
} from "lucide-react";
import { EventPlayerChoices } from "./EventPlayerChoices";
import { getEventDraftSteps } from "./eventDraftSteps";
import { supportsRinkPosition } from "../../../../domain/matches/rinkPosition";
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
  const { activePlayerIds } = state;
  const step = getEventDraftSteps(draft)[0];
  const cardReplacements = draft.matchPlayerId
    ? getCardReplacementPlayers(context, draft.matchPlayerId)
    : [];
  return (
    <div className={st.fields}>
      {step === "chooseGameEvent" && (
        <div className={st.choices}>
          {(["opponent-goal", "timeout", "set-piece"] as const).map((event) => (
            <Button
              key={event}
              variant="default"
              leftSection={
                event === "set-piece" ? (
                  <Crosshair size={20} aria-hidden="true" />
                ) : (
                  <RecorderActionIcon kind={event} />
                )
              }
              onClick={() => onAction({ type: "selectGameEvent", event })}
              disabled={
                event === "set-piece" &&
                getEligiblePlayers(context, "shot").length === 0
              }
            >
              {t(event)}
            </Button>
          ))}
        </div>
      )}
      {step === "chooseSetPiece" && (
        <div className={st.choices}>
          {(["penalty", "direct-free-hit"] as const).map((attemptType) => (
            <Button
              key={attemptType}
              variant="default"
              leftSection={
                attemptType === "penalty" ? (
                  <Target size={20} aria-hidden="true" />
                ) : (
                  <Crosshair size={20} aria-hidden="true" />
                )
              }
              onClick={() =>
                onAction({ type: "selectAttemptType", attemptType })
              }
            >
              {t(attemptType)}
            </Button>
          ))}
        </div>
      )}
      {step === "chooseTimeoutTeam" && (
        <div className={st.choices}>
          {(["own", "opponent"] as const).map((team) => (
            <Button
              key={team}
              variant="default"
              leftSection={<Timer size={20} aria-hidden="true" />}
              onClick={() => onAction({ type: "selectTimeoutTeam", team })}
            >
              {t(team)}
            </Button>
          ))}
        </div>
      )}
      {step === "chooseSave" && (
        <section>
          <div className={st.choices}>
            {(["simple", "difficult"] as const).map((difficulty) => (
              <Button
                key={difficulty}
                variant="default"
                leftSection={
                  difficulty === "simple" ? (
                    <ShieldCheck size={20} aria-hidden="true" />
                  ) : (
                    <Shield size={20} aria-hidden="true" />
                  )
                }
                onClick={() => onAction({ type: "confirmSave", difficulty })}
              >
                {t(difficulty)}
              </Button>
            ))}
          </div>
        </section>
      )}
      {step === "chooseAction" && (
        <section>
          <h3>{t("chooseAction")}</h3>
          <div className={st.choices}>
            {getAvailableEventKinds(context, draft.matchPlayerId)
              .filter(
                (kind) => draft.entry !== "rink" || supportsRinkPosition(kind),
              )
              .map((kind) => (
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
              ))}
          </div>
        </section>
      )}
      {step === "choosePlayer" && (
        <section>
          <h3>{t("choosePlayer")}</h3>
          <EventPlayerChoices
            players={(draft.kind
              ? getEligiblePlayers(
                  context,
                  playerEventKindSchema.parse(draft.kind),
                )
              : snapshot.players
            ).filter(
              (player) =>
                draft.kind !== "card" ||
                !draft.colour ||
                getCardLineupEffect(context, player.id, draft.colour) !== null,
            )}
            activePlayerIds={activePlayerIds}
            onSelect={(id) => onAction({ type: "selectPlayer", id })}
          />
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
            {[
              ...recoverySubtypeSchema.options.filter(
                (subtype) => subtype !== "other",
              ),
              "other" as const,
            ].map((subtype) => (
              <Button
                key={subtype}
                variant="default"
                leftSection={
                  subtype === "interception" ? (
                    <ArrowLeftRight size={20} aria-hidden="true" />
                  ) : subtype === "duel" ? (
                    <Swords size={20} aria-hidden="true" />
                  ) : subtype === "loose-ball" ? (
                    <CircleDot size={20} aria-hidden="true" />
                  ) : subtype === "intercepted-shot" ? (
                    <Shield size={20} aria-hidden="true" />
                  ) : (
                    <CircleEllipsis size={20} aria-hidden="true" />
                  )
                }
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
                leftSection={
                  reason === "intercepted-pass" ? (
                    <ArrowLeftRight size={20} aria-hidden="true" />
                  ) : reason === "failed-individual-action" ? (
                    <UserRoundX size={20} aria-hidden="true" />
                  ) : (
                    <CircleEllipsis size={20} aria-hidden="true" />
                  )
                }
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
                className={st.outcomeChoice}
                data-outcome={outcome}
                leftSection={
                  outcome === "goal" ? (
                    <Trophy size={20} aria-hidden="true" />
                  ) : outcome === "on-target" ? (
                    <Target size={20} aria-hidden="true" />
                  ) : outcome === "off-target" ? (
                    <MoveUpRight size={20} aria-hidden="true" />
                  ) : (
                    <Hand size={20} aria-hidden="true" />
                  )
                }
                onClick={() => onAction({ type: "selectOutcome", outcome })}
              >
                {t(outcome)}
              </Button>
            ))}
          </div>
          {draft.entry !== "rink" &&
            (!draft.attemptType || draft.attemptType === "open-play") && (
              <Button
                variant="subtle"
                onClick={() => onAction({ type: "openSetPiece" })}
              >
                {t("set-piece")}
              </Button>
            )}
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
              <EventPlayerChoices
                players={options}
                activePlayerIds={activePlayerIds}
                onSelect={(id) =>
                  onAction({ type: "selectSubstitute", side, id })
                }
              />
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
                {activePlayerIds.has(draft.matchPlayerId) ? (
                  <Button
                    onClick={() => {
                      if (draft.matchPlayerId)
                        onAction({
                          type: "confirmCard",
                          effect: "remove",
                          removedId: draft.matchPlayerId,
                        });
                    }}
                  >
                    {t("confirmCard")}
                  </Button>
                ) : (
                  <EventPlayerChoices
                    players={getCardRemovalPlayers(
                      context,
                      draft.matchPlayerId,
                    )}
                    activePlayerIds={activePlayerIds}
                    onSelect={(id) =>
                      onAction({
                        type: "confirmCard",
                        effect: "remove",
                        removedId: id,
                      })
                    }
                  />
                )}
              </>
            ) : (
              <>
                <p>{t("cardNeedsReplacement")}</p>
                <p>{t("cardQueuesPowerplay")}</p>
                <EventPlayerChoices
                  players={cardReplacements}
                  activePlayerIds={activePlayerIds}
                  onSelect={(id) =>
                    onAction({
                      type: "confirmCard",
                      effect: "replace",
                      replacementId: id,
                    })
                  }
                />
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
    </div>
  );
}
