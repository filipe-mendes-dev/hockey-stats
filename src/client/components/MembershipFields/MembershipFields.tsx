"use client";

import { useId } from "react";
import { Input, SegmentedControl, TextInput } from "@mantine/core";
import { useTranslations } from "next-intl";
import type { MembershipFieldsProps } from "./MembershipFields.interfaces";
import st from "./MembershipFields.module.css";

export function MembershipFields({
  jerseyNumber,
  role,
  disabled,
  onNumberChange,
  onRoleChange,
}: MembershipFieldsProps) {
  const t = useTranslations("teamPlayers");
  const roleLabelId = useId();
  return (
    <div className={st.fields}>
      <TextInput
        name="jerseyNumber"
        label={t("number")}
        value={jerseyNumber}
        disabled={disabled}
        autoComplete="off"
        onChange={(event) => onNumberChange(event.currentTarget.value)}
      />
      <div>
        <Input.Label id={roleLabelId} labelElement="div">
          {t("role")}
        </Input.Label>
        <SegmentedControl
          name={roleLabelId}
          aria-labelledby={roleLabelId}
          aria-required="true"
          value={role}
          disabled={disabled}
          data={[
            { value: "field-player", label: t("field-player") },
            { value: "goalkeeper", label: t("goalkeeper") },
          ]}
          onChange={(value) => {
            if (value === "field-player" || value === "goalkeeper")
              onRoleChange(value);
          }}
        />
      </div>
    </div>
  );
}
