"use client";
import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import { createTeamInputSchema } from "../../../../domain/teams/validation/teamInput.schema";
import type { CreateTeamInput } from "../../../../domain/teams/validation/teamInput.schema";
import { EntityForm } from "../../../components/EntityForm/EntityForm";
import { TextInputField } from "../../../components/TextInputField/TextInputField";
import type { TeamFormProps } from "./TeamForm.interfaces";
export function TeamForm({
  initial,
  pending,
  failed,
  failedLabel,
  submitLabel,
  onSave,
  onCancel,
}: TeamFormProps) {
  const t = useTranslations("teams");
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [season, setSeason] = useState(initial?.season ?? "");
  const [invalid, setInvalid] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);

  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (submitted.current || pending) return;
    const input = createTeamInputSchema.safeParse({ name, category, season });
    if (!input.success) {
      setInvalid(true);
      nameInput.current?.focus();
      return;
    }
    submitted.current = true;
    void save(input.data);
  }

  async function save(input: CreateTeamInput): Promise<void> {
    try {
      await onSave(input);
    } catch {
      // Mutation state displays the error while retaining the form draft.
    } finally {
      submitted.current = false;
    }
  }

  return (
    <EntityForm
      pending={pending}
      failed={failed}
      failedLabel={failedLabel}
      submitLabel={pending ? t("saving") : submitLabel}
      cancelLabel={t("cancel")}
      cancelHref="/app/teams"
      {...(onCancel ? { onCancel } : {})}
      onSubmit={submit}
    >
      <TextInputField
        inputRef={nameInput}
        name="name"
        label={t("name")}
        requiredLabel={t("required")}
        placeholder={t("namePlaceholder")}
        autoComplete="off"
        autoCapitalize="words"
        required
        disabled={pending}
        value={name}
        error={invalid ? t("nameRequired") : undefined}
        onChange={(event) => {
          setName(event.target.value);
          if (invalid && event.target.value.trim()) setInvalid(false);
        }}
      />
      <TextInputField
        name="category"
        label={t("category")}
        requiredLabel={t("required")}
        placeholder={t("categoryPlaceholder")}
        autoComplete="off"
        value={category}
        disabled={pending}
        onChange={(event) => {
          setCategory(event.target.value);
        }}
      />
      <TextInputField
        name="season"
        label={t("season")}
        requiredLabel={t("required")}
        placeholder={t("seasonPlaceholder")}
        autoComplete="off"
        value={season}
        disabled={pending}
        onChange={(event) => {
          setSeason(event.target.value);
        }}
      />
    </EntityForm>
  );
}
