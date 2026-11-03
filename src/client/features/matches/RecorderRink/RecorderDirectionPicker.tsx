"use client";

import { SegmentedControl } from "@mantine/core";
import { useTranslations } from "next-intl";
import { RecorderRinkDirection } from "./RecorderRinkDirection";
import type { RecorderDirectionPickerProps } from "./RecorderDirectionPicker.interfaces";
import st from "./RecorderDirectionPicker.module.css";

export function RecorderDirectionPicker({
  direction,
  disabled,
  onChange,
}: RecorderDirectionPickerProps) {
  const t = useTranslations("recorder");
  return (
    <div className={st.picker}>
      {direction === undefined ? (
        <p className={st.help}>{t("nextPeriodChooseDirection")}</p>
      ) : (
        <RecorderRinkDirection direction={direction} />
      )}
      <SegmentedControl
        fullWidth
        radius="xl"
        value={direction ?? ""}
        onChange={(value) => {
          if (value === "toward-x0" || value === "toward-x1") onChange(value);
        }}
        disabled={disabled}
        classNames={{ label: st.label }}
        data={[
          { value: "toward-x0", label: t("attackLeft") },
          { value: "toward-x1", label: t("attackRight") },
        ]}
        aria-label={t("attackDirection")}
      />
    </div>
  );
}
