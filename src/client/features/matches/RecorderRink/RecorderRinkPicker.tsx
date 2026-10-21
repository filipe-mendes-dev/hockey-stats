"use client";

import { Button } from "@mantine/core";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { RinkPositionPicker } from "../../../components/RinkPositionPicker/RinkPositionPicker";
import { toViewPosition } from "../../../../domain/matches/rinkPosition";
import { useControlMatch } from "../mutations/matchControl.mutations";
import type { RinkAttackDirection } from "../../../../domain/matches/rinkPosition";
import type { RecorderRinkPickerProps } from "./RecorderRink.interfaces";
import st from "./RecorderRinkPicker.module.css";

export function RecorderRinkPicker({
  match,
  period,
  direction,
  position,
  disabled = false,
  autoFocus = false,
  compactHint = false,
  onStart,
  onSelect,
  onCancelGesture,
  onDirectionPending,
}: RecorderRinkPickerProps) {
  const t = useTranslations("recorder");
  const mutation = useControlMatch();
  function selectDirection(attackDirection: RinkAttackDirection): void {
    onDirectionPending?.(true);
    mutation.mutate(
      {
        id: match.id,
        expectedRevision: match.revision,
        action: { type: "period.direction", attackDirection },
      },
      { onSettled: () => onDirectionPending?.(false) },
    );
  }
  if (!direction)
    return (
      <div className={st.directionChoice}>
        <p>{t("rinkDirectionRequired")}</p>
        <div className={st.directionButtons}>
          <Button
            variant="default"
            disabled={disabled || mutation.isPending}
            onClick={() => selectDirection("toward-x0")}
          >
            {t("attackLeft")}
          </Button>
          <Button
            variant="default"
            disabled={disabled || mutation.isPending}
            onClick={() => selectDirection("toward-x1")}
          >
            {t("attackRight")}
          </Button>
        </div>
        {mutation.isError && (
          <p role="alert" className={st.error}>
            {t("controlFailed")}
          </p>
        )}
      </div>
    );
  const leftTeam =
    direction === "toward-x1" ? match.teamNameAtMatch : match.opponentName;
  const rightTeam =
    direction === "toward-x1" ? match.opponentName : match.teamNameAtMatch;
  return (
    <div className={st.picker} data-compact-hint={compactHint}>
      <div className={st.direction}>
        {direction === "toward-x0" ? (
          <ArrowLeft size={18} aria-hidden="true" />
        ) : (
          <ArrowRight size={18} aria-hidden="true" />
        )}
        <span>
          {t("rinkAttacking", {
            team: match.teamNameAtMatch,
            direction: t(direction === "toward-x0" ? "rinkLeft" : "rinkRight"),
          })}
        </span>
      </div>
      <div className={st.ends}>
        <span title={t("rinkGoal", { team: leftTeam })}>
          {t("rinkGoal", { team: leftTeam })}
        </span>
        <span title={t("rinkGoal", { team: rightTeam })}>
          {t("rinkGoal", { team: rightTeam })}
        </span>
      </div>
      <RinkPositionPicker
        key={`${period}-${direction}`}
        label={t("rinkSelect")}
        hint={t(compactHint ? "rinkDesktopHint" : "rinkHint")}
        invalidLabel={t("rinkOutside")}
        positionLabel={(point) =>
          t("rinkCoordinates", {
            x: Math.round(point.x * 100),
            y: Math.round(point.y * 100),
          })
        }
        initialPosition={
          position ? toViewPosition(position, direction) : undefined
        }
        disabled={disabled}
        autoFocus={autoFocus}
        hideIdleStatus={compactHint}
        onStart={onStart}
        onSelect={onSelect}
        onCancelGesture={onCancelGesture}
      />
    </div>
  );
}
