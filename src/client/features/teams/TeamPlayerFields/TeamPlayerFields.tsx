import { useId } from "react";
import { useTranslations } from "next-intl";
import { TextInputField } from "../../../components/TextInputField/TextInputField";
import type { TeamPlayerFieldsProps } from "./TeamPlayerFields.interfaces";
import st from "./TeamPlayerFields.module.css";
export function TeamPlayerFields({
  jerseyNumber,
  role,
  disabled,
  onNumberChange,
  onRoleChange,
}: TeamPlayerFieldsProps) {
  const t = useTranslations("teamPlayers");
  const id = useId();
  return (
    <div className={st.fields}>
      <TextInputField
        name="jerseyNumber"
        label={t("number")}
        requiredLabel=""
        autoComplete="off"
        value={jerseyNumber}
        disabled={disabled}
        onChange={(event) => onNumberChange(event.target.value)}
      />
      <label className={st.select} htmlFor={id}>
        {t("role")}
        <select
          id={id}
          value={role}
          disabled={disabled}
          onChange={(event) => {
            if (
              event.target.value === "field-player" ||
              event.target.value === "goalkeeper"
            )
              onRoleChange(event.target.value);
          }}
        >
          <option value="field-player">{t("field-player")}</option>
          <option value="goalkeeper">{t("goalkeeper")}</option>
        </select>
      </label>
    </div>
  );
}
