"use client";

import { Autocomplete, TextInput } from "@mantine/core";
import { useTranslations } from "next-intl";
import type { TeamFieldsProps } from "./TeamFields.interfaces";
import { SeasonPicker } from "../SeasonPicker/SeasonPicker";
import st from "./TeamFields.module.css";

const categories = ["Senior", "U-19", "U-17", "U-15", "Veteran"];

export function TeamFields({
  values,
  disabled,
  invalidName,
  nameInputRef,
  onChange,
}: TeamFieldsProps) {
  const t = useTranslations("teams");
  return (
    <div className={st.fields}>
      <TextInput
        ref={nameInputRef}
        name="name"
        label={t("name")}
        placeholder={t("namePlaceholder")}
        required
        autoComplete="off"
        autoCapitalize="words"
        value={values.name}
        disabled={disabled}
        error={invalidName ? t("nameRequired") : undefined}
        errorProps={{ role: "alert" }}
        onChange={(event) =>
          onChange({ ...values, name: event.currentTarget.value })
        }
      />
      <Autocomplete
        name="category"
        label={t("categoryOptional")}
        placeholder={t("categoryChoicePlaceholder")}
        autoComplete="off"
        data={categories}
        clearable
        clearButtonProps={{ "aria-label": t("clearCategory") }}
        comboboxProps={{ withinPortal: false }}
        value={values.category}
        disabled={disabled}
        onChange={(category) => onChange({ ...values, category })}
      />
      <SeasonPicker
        value={values.season}
        disabled={disabled}
        onChange={(season) => onChange({ ...values, season })}
      />
    </div>
  );
}
