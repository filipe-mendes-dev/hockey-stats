"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Alert, Button } from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { deriveChronologicalMatchState } from "../../../../domain/matches/derivedMatchState";
import {
  getLineupDecision,
  getSubstitutionDecision,
  getSubstitutionPartners,
} from "../../../../domain/matches/matchRules";
import { getNextAttackDirection } from "../../../../domain/matches/nextMatchPeriod";
import type { RinkAttackDirection } from "../../../../domain/matches/rinkPosition";
import { RecorderDialog } from "../RecorderDialog/RecorderDialog";
import { EventPlayerChoices } from "../EventRecorder/EventPlayerChoices";
import { RecorderContext } from "../RecorderContext/RecorderContext";
import { RecorderDirectionPicker } from "../RecorderRink/RecorderDirectionPicker";
import { useStartNextMatchPeriod } from "../mutations/nextMatchPeriod.mutations";
import type { NextPeriodDialogProps } from "./NextPeriodDialog.interfaces";
import st from "./NextPeriodDialog.module.css";

export function NextPeriodDialog({
  snapshot,
  events,
  onClose,
}: NextPeriodDialogProps) {
  const [initial] = useState(() => ({
    snapshot,
    state: deriveChronologicalMatchState(snapshot, events),
  }));
  const [playerIds, setPlayerIds] = useState(() => [
    ...initial.state.activePlayerIds,
  ]);
  const [outgoingId, setOutgoingId] = useState<string>();
  const previousOutgoingId = useRef(outgoingId);
  const lineupHeading = useRef<HTMLHeadingElement>(null);
  const [direction, setDirection] = useState<RinkAttackDirection | undefined>(
    () => getNextAttackDirection(initial.snapshot.match),
  );
  const mutation = useStartNextMatchPeriod();
  const formId = useId();
  const t = useTranslations("recorder");
  const requiredCount = initial.state.activePlayerIds.size;
  const selected = new Set(playerIds);
  const context = {
    snapshot: initial.snapshot,
    state: { ...initial.state, activePlayerIds: selected },
  };
  const valid =
    initial.state.valid &&
    selected.size === requiredCount &&
    getLineupDecision(initial.snapshot, selected, initial.state.maxOnField)
      .allowed &&
    !playerIds.some((id) => initial.state.ejectedPlayerIds.has(id));
  const players = initial.snapshot.players;
  const outgoing = players.find((player) => player.id === outgoingId);
  const currentPlayers = players.filter((player) => selected.has(player.id));
  const incomingPlayers = outgoing
    ? players.filter(
        (player) =>
          getSubstitutionDecision(context, outgoing.id, player.id).allowed,
      )
    : [];
  const disabledPlayerIds = new Set(
    currentPlayers
      .filter(
        (player) => getSubstitutionPartners(context, player.id).length === 0,
      )
      .map((player) => player.id),
  );

  useEffect(() => {
    if (previousOutgoingId.current !== outgoingId) {
      lineupHeading.current?.focus({ preventScroll: true });
      previousOutgoingId.current = outgoingId;
    }
  }, [outgoingId]);

  function replacePlayer(incomingId: string): void {
    if (
      !outgoing ||
      mutation.isPending ||
      !getSubstitutionDecision(context, outgoing.id, incomingId).allowed
    )
      return;
    setPlayerIds((current) =>
      current.map((id) => (id === outgoing.id ? incomingId : id)),
    );
    setOutgoingId(undefined);
  }

  return (
    <RecorderDialog
      wide
      topAligned
      title={t("nextPeriod")}
      pending={mutation.isPending}
      onClose={onClose}
      footer={
        <>
          <Button
            type="button"
            variant="subtle"
            size="sm"
            disabled={mutation.isPending}
            onClick={onClose}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            size="sm"
            form={formId}
            loading={mutation.isPending}
            disabled={
              mutation.isPending ||
              !valid ||
              direction === undefined ||
              outgoing !== undefined
            }
          >
            {t("nextPeriod")}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className={st.form}
        aria-label={t("nextPeriod")}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (
            !valid ||
            direction === undefined ||
            outgoing ||
            mutation.isPending
          )
            return;
          mutation.mutate(
            {
              id: initial.snapshot.match.id,
              expectedRevision: initial.snapshot.match.revision,
              playerIds,
              attackDirection: direction,
            },
            { onSuccess: onClose },
          );
        }}
      >
        <p className={st.help}>{t("nextPeriodHelp")}</p>
        <div className={st.columns}>
          <section
            className={st.section}
            aria-labelledby="next-period-direction"
          >
            <h2 id="next-period-direction" className={st.heading}>
              {t("attackDirection")}
            </h2>
            <RecorderDirectionPicker
              direction={direction}
              disabled={mutation.isPending}
              onChange={setDirection}
            />
          </section>
          <section className={st.section} aria-labelledby="next-period-lineup">
            <div className={st.header}>
              <h2
                ref={lineupHeading}
                id="next-period-lineup"
                className={st.heading}
                tabIndex={-1}
              >
                {t(outgoing ? "chooseIncoming" : "nextPeriodLineup")}
              </h2>
              {outgoing ? (
                <Button
                  type="button"
                  variant="subtle"
                  size="sm"
                  className={st.back}
                  leftSection={<ArrowLeft size={16} aria-hidden="true" />}
                  disabled={mutation.isPending}
                  onClick={() => setOutgoingId(undefined)}
                >
                  {t("back")}
                </Button>
              ) : (
                <span className={st.count}>
                  {selected.size}/{requiredCount}
                </span>
              )}
            </div>
            {outgoing ? (
              <>
                <RecorderContext
                  match={initial.snapshot.match}
                  period={initial.snapshot.match.currentPeriod}
                  elapsedMs={undefined}
                  primary={outgoing.playerNameAtMatch}
                  kind="substitution"
                  showTime={false}
                />
                <EventPlayerChoices
                  players={incomingPlayers}
                  activePlayerIds={selected}
                  disabled={mutation.isPending}
                  onSelect={replacePlayer}
                />
              </>
            ) : (
              <>
                <p className={st.help}>{t("nextPeriodLineupHelp")}</p>
                <EventPlayerChoices
                  players={currentPlayers}
                  activePlayerIds={selected}
                  disabled={mutation.isPending}
                  disabledPlayerIds={disabledPlayerIds}
                  onSelect={setOutgoingId}
                />
              </>
            )}
          </section>
        </div>
        {mutation.isError && (
          <Alert color="red" role="alert">
            {t("controlFailed")}
          </Alert>
        )}
      </form>
    </RecorderDialog>
  );
}
