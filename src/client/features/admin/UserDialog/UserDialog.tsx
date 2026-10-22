"use client";

import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Alert, Text, TextInput } from "@mantine/core";
import { useTranslations } from "next-intl";
import {
  adminUserActionSchema,
  userNameSchema,
} from "../../../../contracts/admin-users.schema";
import type { AdminUsersErrorCode } from "../../../../contracts/admin-users.schema";
import { HelpPopover } from "../../../components/HelpPopover/HelpPopover";
import { ResponsiveFormDialog } from "../../../components/ResponsiveFormDialog/ResponsiveFormDialog";
import { PasswordFields } from "../PasswordFields/PasswordFields";
import { passwordFieldsSchema } from "../userForms.schema";
import { AdminUsersRequestError, submitUserAction } from "../users.api";
import type { UserDialogProps } from "./UserDialog.interfaces";
import st from "./UserDialog.module.css";

export function UserDialog({
  selection,
  administratorId,
  onClose,
  onSaved,
}: UserDialogProps) {
  const t = useTranslations("adminUsers");
  const { action, user } = selection;
  const [name, setName] = useState(user.name);
  const [passwords, setPasswords] = useState({
    password: "",
    passwordConfirmation: "",
  });
  const [confirmation, setConfirmation] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AdminUsersErrorCode | null>(null);
  const submitting = useRef(false);

  function close(): void {
    if (!submitting.current) {
      setPasswords({ password: "", passwordConfirmation: "" });
      onClose();
    }
  }

  async function submit(event: SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting.current) return;
    if (action === "password") {
      const values = passwordFieldsSchema.safeParse(passwords);
      if (!values.success) {
        setInvalid(true);
        const fieldName = values.error.issues[0]?.path[0];
        const field =
          typeof fieldName === "string"
            ? event.currentTarget.elements.namedItem(fieldName)
            : null;
        if (field instanceof HTMLElement) field.focus();
        return;
      }
    }
    const payload: unknown =
      action === "edit"
        ? { action, userId: user.id, name }
        : action === "password"
          ? { action, userId: user.id, password: passwords.password }
          : action === "delete"
            ? { action, userId: user.id, confirmation }
            : { action, userId: user.id };
    const parsed = adminUserActionSchema.safeParse(payload);
    if (
      !parsed.success ||
      (action === "delete" && confirmation !== user.username)
    ) {
      setInvalid(true);
      return;
    }
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      await submitUserAction(administratorId, parsed.data);
      setPasswords({ password: "", passwordConfirmation: "" });
      onSaved();
    } catch (failure: unknown) {
      setError(
        failure instanceof AdminUsersRequestError
          ? failure.code
          : "unavailable",
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <ResponsiveFormDialog
      opened
      title={t(`actions.${action}`)}
      closeLabel={t("cancel")}
      cancelLabel={t("cancel")}
      submitLabel={t(pending ? "saving" : `actions.${action}`)}
      submitDisabled={action === "delete" && confirmation !== user.username}
      destructive={action === "delete" || action === "disable"}
      pending={pending}
      error={error ? t(`errors.${error}`) : null}
      onSubmit={(event) => void submit(event)}
      onClose={close}
    >
      <div className={st.intro}>
        <div className={st.headingRow}>
          <Text component="h2" className={st.heading}>
            {t(`dialogTitles.${action}`)}
          </Text>
          {(action === "password" ||
            action === "disable" ||
            action === "enable") && (
            <HelpPopover label={t("actionHelp")}>
              {t(
                action === "password"
                  ? "replacePassword"
                  : action === "disable"
                    ? "disableDescription"
                    : "enableDescription",
              )}
            </HelpPopover>
          )}
        </div>
        <Text className={st.description}>
          {t(`dialogDescriptions.${action}`, {
            username: user.username ?? user.name,
          })}
        </Text>
      </div>
      {action === "edit" && (
        <TextInput
          name="name"
          label={t("name")}
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          onBlur={() => setNameTouched(true)}
          required
          maxLength={120}
          autoComplete="off"
          disabled={pending}
          error={
            (invalid || nameTouched) && !userNameSchema.safeParse(name).success
              ? t("nameInvalid")
              : null
          }
        />
      )}
      {action === "password" && (
        <PasswordFields
          values={passwords}
          onChange={setPasswords}
          disabled={pending}
          invalid={invalid}
        />
      )}
      {action === "delete" && (
        <>
          <Alert color="red" role="alert">
            {t("deleteDescription")}
          </Alert>
          <TextInput
            label={t("confirmUsername", { username: user.username ?? "" })}
            value={confirmation}
            onChange={(event) => setConfirmation(event.currentTarget.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={30}
            disabled={pending}
            error={
              invalid && confirmation !== user.username
                ? t("errors.confirmation_mismatch")
                : null
            }
          />
        </>
      )}
    </ResponsiveFormDialog>
  );
}
