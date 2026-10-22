"use client";

import { useTranslations } from "next-intl";
import { RinkPositionPicker } from "../../../components/RinkPositionPicker/RinkPositionPicker";
import {
  getPositionHalf,
  toTeamPosition,
  toViewPosition,
} from "../../../../domain/matches/rinkPosition";
import { useControlMatch } from "../mutations/matchControl.mutations";
import type { RinkAttackDirection } from "../../../../domain/matches/rinkPosition";
import type { RecorderRinkPickerProps } from "./RecorderRink.interfaces";
import { RecorderRinkDirection } from "./RecorderRinkDirection";
import st from "./RecorderRinkPicker.module.css";

export function RecorderRinkPicker({
  match,
  period,
  direction,
  position,
  disabled = false,
  autoFocus = false,
  compactHint = false,
  hintAccessory,
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
          <button
            type="button"
            className={st.directionOption}
            disabled={disabled || mutation.isPending}
            onClick={() => selectDirection("toward-x0")}
          >
            <RecorderRinkDirection direction="toward-x0" compact />
            <span>{t("attackLeft")}</span>
          </button>
          <button
            type="button"
            className={st.directionOption}
            disabled={disabled || mutation.isPending}
            onClick={() => selectDirection("toward-x1")}
          >
            <RecorderRinkDirection direction="toward-x1" compact />
            <span>{t("attackRight")}</span>
          </button>
        </div>
        {mutation.isError && (
          <p role="alert" className={st.error}>
            {t("controlFailed")}
          </p>
        )}
      </div>
    );
  return (
    <div className={st.picker}>
      <RinkPositionPicker
        key={`${period}-${direction}`}
        label={t("rinkSelect")}
        hint={t(compactHint ? "rinkDesktopHint" : "rinkHint")}
        touchHint={t("rinkTouchHint")}
        hintAccessory={hintAccessory}
        invalidLabel={t("rinkOutside")}
        positionLabel={(point) => {
          const half = getPositionHalf(toTeamPosition(point, direction));
          return half
            ? t("rinkPositionHalf", { half: t(half) })
            : t("rinkPositionHalfway");
        }}
        orientation={{
          attackingEnd: direction === "toward-x0" ? "left" : "right",
          attackLabel: t("rinkAttack"),
          defenceLabel: t("rinkDefence"),
        }}
        initialPosition={
          position ? toViewPosition(position, direction) : undefined
        }
        disabled={disabled}
        autoFocus={autoFocus}
        onStart={onStart}
        onSelect={onSelect}
        onCancelGesture={onCancelGesture}
      />
    </div>
  );
}
