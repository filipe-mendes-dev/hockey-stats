"use client";

import { useTranslations } from "next-intl";
import { RinkPositionPicker } from "../../../components/RinkPositionPicker/RinkPositionPicker";
import { HockeyRink } from "../../../components/HockeyRink/HockeyRink";
import {
  getPositionHalf,
  toTeamPosition,
  toViewPosition,
} from "../../../../domain/matches/rinkPosition";
import type { RecorderRinkPickerProps } from "./RecorderRink.interfaces";
import { RecorderRinkToolbar } from "./RecorderRinkToolbar";
import st from "./RecorderRinkPicker.module.css";

export function RecorderRinkPicker({
  period,
  direction,
  position,
  disabled = false,
  autoFocus = false,
  purpose = "position",
  controlsDisabled,
  onStart,
  onSelect,
  onCancelGesture,
  onChangeDirection,
  onClear,
}: RecorderRinkPickerProps) {
  const t = useTranslations("recorder");
  const toolbar = (
    <RecorderRinkToolbar
      hint={t(
        !direction
          ? "attackDirection"
          : purpose === "register"
            ? "rinkRegisterHint"
            : position
              ? "rinkSelectedHint"
              : "rinkAddPositionHint",
      )}
      disabled={controlsDisabled}
      onChangeDirection={onChangeDirection}
      onClear={position ? onClear : undefined}
    />
  );
  if (!direction)
    return (
      <div className={st.picker}>
        <div className={st.unknownRink}>
          <HockeyRink label={t("rinkDirectionRequired")} />
        </div>
        {toolbar}
      </div>
    );
  return (
    <div className={st.picker}>
      <RinkPositionPicker
        key={`${period}-${direction}`}
        label={t("rinkSelect")}
        hint={t("rinkHint")}
        touchHint={t("rinkTouchHint")}
        hideHint
        hintAccessory={toolbar}
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
