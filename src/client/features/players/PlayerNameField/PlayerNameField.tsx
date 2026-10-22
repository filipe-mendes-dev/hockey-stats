"use client";

import { TextInput } from "@mantine/core";
import { useTranslations } from "next-intl";
import st from "./PlayerNameField.module.css";
import type { PlayerNameFieldProps } from "./PlayerNameField.interfaces";

export function PlayerNameField({
  value,
  disabled,
  invalid,
  inputRef,
  onChange,
}: PlayerNameFieldProps) {
  const t = useTranslations("players");
  return (
    <TextInput
      className={st.field}
      ref={inputRef}
      name="name"
      label={t("name")}
      placeholder={t("namePlaceholder")}
      autoComplete="off"
      autoCapitalize="words"
      required
      disabled={disabled}
      value={value}
      error={invalid ? t("nameRequired") : undefined}
      errorProps={{ role: "alert" }}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
}
