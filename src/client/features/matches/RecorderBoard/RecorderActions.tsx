"use client";
import { Button } from "@mantine/core";
import { Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { getAvailableEventKinds } from "../../../../domain/matches/matchRules";
import { RecorderActionIcon } from "./RecorderActionIcon";
import {
  recorderPrimaryActions,
  recorderSecondaryActions,
} from "./recorderActionOrder";
import type { RecorderActionsProps } from "./RecorderBoard.interfaces";
import st from "./RecorderActions.module.css";
const boardActions = [...recorderPrimaryActions, ...recorderSecondaryActions];
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
        {boardActions.map((kind) => (
          <button
            key={kind}
            type="button"
            disabled={disabled || !available.includes(kind)}
            onClick={() => onPick({ kind })}
            className={st.action}
            data-kind={kind}
            data-prominent={recorderPrimaryActions.includes(kind) || undefined}
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
          onClick={() => onPick({ entry: "game" })}
          leftSection={<RecorderActionIcon kind="opponent-goal" size={16} />}
        >
          {t("gameEvent")}
        </Button>
      </div>
    </section>
  );
}
