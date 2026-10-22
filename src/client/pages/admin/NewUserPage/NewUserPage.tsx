"use client";

import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { TextInput } from "@mantine/core";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormLayout } from "../../../components/FormLayout/FormLayout";
import { HelpPopover } from "../../../components/HelpPopover/HelpPopover";
import { PageHeader } from "../../../components/PageHeader/PageHeader";
import { authClient } from "../../../features/auth/auth-client";
import { PasswordFields } from "../../../features/admin/PasswordFields/PasswordFields";
import { newUserFormSchema } from "../../../features/admin/userForms.schema";
import {
  AdminUsersRequestError,
  submitUserAction,
} from "../../../features/admin/users.api";
import {
  userNameSchema,
  userUsernameSchema,
} from "../../../../contracts/admin-users.schema";
import type { AdminUsersErrorCode } from "../../../../contracts/admin-users.schema";
import st from "./NewUserPage.module.css";

export function NewUserPage() {
  const t = useTranslations("adminUsers");
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const administratorId =
    session?.user.role === "admin" && !session.user.banned
      ? session.user.id
      : undefined;
  const [fields, setFields] = useState({
    name: "",
    username: "",
    password: "",
    passwordConfirmation: "",
  });
  const [invalid, setInvalid] = useState(false);
  const [touched, setTouched] = useState({ name: false, username: false });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AdminUsersErrorCode | null>(null);
  const submitting = useRef(false);

  async function submit(event: SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting.current || !administratorId) return;
    const input = newUserFormSchema.safeParse(fields);
    if (!input.success) {
      setInvalid(true);
      const fieldName = input.error.issues[0]?.path[0];
      const field =
        typeof fieldName === "string"
          ? event.currentTarget.elements.namedItem(fieldName)
          : null;
      if (field instanceof HTMLElement) field.focus();
      return;
    }
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      await submitUserAction(administratorId, {
        action: "create",
        name: input.data.name,
        username: input.data.username,
        password: input.data.password,
      });
      setFields({
        name: "",
        username: "",
        password: "",
        passwordConfirmation: "",
      });
      router.replace("/app/admin/users");
    } catch (failure: unknown) {
      setError(
        failure instanceof AdminUsersRequestError
          ? failure.code
          : "unavailable",
      );
      setPending(false);
      submitting.current = false;
    }
  }

  return (
    <section className={st.page}>
      <PageHeader
        title={t("actions.create")}
        description={t("newDescription")}
        back={{ href: "/app/admin/users", label: t("backToUsers") }}
        actions={
          <HelpPopover label={t("creationHelp")}>
            {t("creationDetails")}
          </HelpPopover>
        }
      />
      <FormLayout
        label={t("actions.create")}
        pending={pending}
        error={error ? t(`errors.${error}`) : null}
        submitLabel={t(pending ? "saving" : "actions.create")}
        cancelLabel={t("cancel")}
        cancelHref="/app/admin/users"
        actionsLayout="creation"
        submitDisabled={!administratorId}
        onSubmit={(event) => void submit(event)}
      >
        <TextInput
          name="name"
          label={t("name")}
          required
          maxLength={120}
          autoComplete="off"
          value={fields.name}
          onChange={(event) =>
            setFields({ ...fields, name: event.currentTarget.value })
          }
          onBlur={() => setTouched({ ...touched, name: true })}
          disabled={pending}
          error={
            (invalid || touched.name) &&
            !userNameSchema.safeParse(fields.name).success
              ? t("nameInvalid")
              : null
          }
        />
        <TextInput
          label={t("username")}
          name="username"
          required
          minLength={3}
          maxLength={30}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={fields.username}
          onChange={(event) =>
            setFields({ ...fields, username: event.currentTarget.value })
          }
          onBlur={() => setTouched({ ...touched, username: true })}
          disabled={pending}
          error={
            (invalid || touched.username) &&
            !userUsernameSchema.safeParse(fields.username).success
              ? t("usernameInvalid")
              : null
          }
        />
        <PasswordFields
          values={fields}
          onChange={(values) => setFields({ ...fields, ...values })}
          disabled={pending}
          invalid={invalid}
        />
      </FormLayout>
    </section>
  );
}
