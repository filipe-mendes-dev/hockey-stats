"use client";

import { useState } from "react";
import { PasswordInput } from "@mantine/core";
import { useTranslations } from "next-intl";
import {
  maximumUserPasswordLength,
  minimumUserPasswordLength,
  userPasswordSchema,
} from "../../../../contracts/admin-users.schema";
import type { PasswordFieldsProps } from "./PasswordFields.interfaces";
import st from "./PasswordFields.module.css";

export function PasswordFields({
  values,
  disabled,
  invalid,
  onChange,
}: PasswordFieldsProps) {
  const t = useTranslations("adminUsers");
  const auth = useTranslations("auth");
  const [visible, setVisible] = useState(false);
  const [touched, setTouched] = useState({
    password: false,
    confirmation: false,
  });
  const passwordInvalid =
    (invalid || touched.password) &&
    !userPasswordSchema.safeParse(values.password).success;
  const mismatch =
    (invalid || touched.confirmation) &&
    (values.passwordConfirmation.length === 0 ||
      values.passwordConfirmation !== values.password);

  return (
    <div className={st.fields}>
      <PasswordInput
        label={t("password")}
        description={t("passwordLengthHint")}
        name="password"
        value={values.password}
        onChange={(event) =>
          onChange({ ...values, password: event.currentTarget.value })
        }
        onBlur={() => setTouched({ ...touched, password: true })}
        required
        minLength={minimumUserPasswordLength}
        maxLength={maximumUserPasswordLength}
        autoComplete="new-password"
        disabled={disabled}
        visible={visible}
        onVisibilityChange={setVisible}
        visibilityToggleButtonProps={{
          "aria-label": auth(visible ? "hidePassword" : "showPassword"),
        }}
        error={passwordInvalid ? t("passwordInvalid") : null}
      />
      <PasswordInput
        name="passwordConfirmation"
        label={t("passwordConfirmation")}
        value={values.passwordConfirmation}
        onChange={(event) =>
          onChange({
            ...values,
            passwordConfirmation: event.currentTarget.value,
          })
        }
        onBlur={() => setTouched({ ...touched, confirmation: true })}
        required
        maxLength={maximumUserPasswordLength}
        autoComplete="new-password"
        disabled={disabled}
        visible={visible}
        onVisibilityChange={setVisible}
        visibilityToggleButtonProps={{
          "aria-label": auth(visible ? "hidePassword" : "showPassword"),
        }}
        error={mismatch ? t("passwordMismatch") : null}
      />
    </div>
  );
}
