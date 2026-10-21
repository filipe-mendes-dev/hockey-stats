"use client";

import { useState } from "react";
import { NumberInput, Select } from "@mantine/core";
import { useTranslations } from "next-intl";
import {
  halfDurationPresets,
  createRegulationPeriods,
} from "../../../../domain/matches/matchFormat";
import { regulationPeriodsSchema } from "../../../../domain/matches/match.schema";
import type { MatchDurationFieldProps } from "./MatchDurationField.interfaces";
import st from "./MatchDurationField.module.css";

export function MatchDurationField({
  value,
  disabled,
  invalid,
  onChange,
}: MatchDurationFieldProps) {
  const t = useTranslations("matches");
  const preset = halfDurationPresets.some(
    (minutes) => String(minutes) === value,
  );
  const [custom, setCustom] = useState(Boolean(value) && !preset);
  const error =
    invalid &&
    !regulationPeriodsSchema.safeParse(createRegulationPeriods(Number(value)))
      .success
      ? t("durationRequired")
      : undefined;
  return (
    <div className={st.field}>
      <Select
        name="halfDurationPreset"
        label={t("halfDuration")}
        description={t("twoHalvesDescription")}
        placeholder={t("chooseDuration")}
        required
        value={custom ? "custom" : value || null}
        disabled={disabled}
        comboboxProps={{ withinPortal: false }}
        data={[
          ...halfDurationPresets.map((minutes) => ({
            value: String(minutes),
            label: t("periodDuration", { minutes }),
          })),
          { value: "custom", label: t("customDuration") },
        ]}
        error={!custom ? error : undefined}
        errorProps={{ role: "alert" }}
        onChange={(next) => {
          setCustom(next === "custom");
          onChange(next === "custom" ? "" : (next ?? ""));
        }}
      />
      {custom && (
        <NumberInput
          name="halfDurationMinutes"
          label={t("customDurationMinutes")}
          required
          value={value}
          disabled={disabled}
          allowNegative={false}
          clampBehavior="none"
          hideControls
          error={error}
          errorProps={{ role: "alert" }}
          onChange={(next) => onChange(String(next))}
        />
      )}
    </div>
  );
}
