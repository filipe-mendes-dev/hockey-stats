"use client";
import { Button } from "@mantine/core";
import { Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { getAvailableEventKinds } from "../../../../domain/matches/matchRules";
import type { PlayerEventKind } from "../../../../domain/matches/matchEvent.schema";
import { RecorderActionIcon } from "./RecorderActionIcon";
import type { RecorderActionsProps } from "./RecorderBoard.interfaces";
import st from "./RecorderActions.module.css";
const primaryKinds: PlayerEventKind[] = [
  "ball-recovery",
  "ball-loss",
  "shot",
  "team-foul",
  "card",
  "substitution",
];
export function RecorderActions({
  context,
  disabled,
  onPick,
  undoDisabled,
  undoPending,
  onUndo,
}: RecorderActionsProps) {
  const t = useTranslations("recorder");
  const available = getAvailableEventKinds(context);
  return (
    <section aria-label={t("actions")} className={st.section}>
      <div className={st.grid}>
        {primaryKinds.map((kind) => (
          <button
            key={kind}
            type="button"
            disabled={disabled || !available.includes(kind)}
            onClick={() => onPick({ kind })}
            className={st.action}
          >
            <RecorderActionIcon kind={kind} />
            <span>{t(kind)}</span>
          </button>
        ))}
      </div>
      <div className={st.secondary}>
        <Button
          variant="subtle"
          size="sm"
          disabled={undoDisabled}
          onClick={onUndo}
          leftSection={<Undo2 size={16} aria-hidden="true" />}
        >
          {t(undoPending ? "undoing" : "undo")}
        </Button>
        <Button
          variant="subtle"
          size="sm"
          disabled={disabled}
          onClick={() => onPick({ kind: "opponent-goal" })}
          leftSection={<RecorderActionIcon kind="opponent-goal" size={16} />}
        >
          {t("opponent-goal")}
        </Button>
      </div>
      {available.includes("player-in") && (
        <Button
          variant="subtle"
          size="sm"
          disabled={disabled}
          onClick={() => onPick({ kind: "player-in" })}
          leftSection={<RecorderActionIcon kind="player-in" size={16} />}
        >
          {t("player-in")}
        </Button>
      )}
      {context.state.isPowerplay && (
        <div className={st.penalty}>
          <span>
            {t("powerplayActive", {
              maximum: String(context.state.maxOnField),
              queued: String(
                Math.max(0, context.state.powerplayCardEventIds.length - 1),
              ),
            })}
          </span>
          <Button
            variant="subtle"
            size="sm"
            disabled={disabled}
            onClick={() => onPick({ kind: "powerplay-end" })}
          >
            {t("powerplay-end")}
          </Button>
        </div>
      )}
    </section>
  );
}
