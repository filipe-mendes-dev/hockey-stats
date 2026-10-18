"use client";

import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCreateTeam } from "../../../features/teams/mutations/teams.mutations";
import { createTeamInputSchema } from "../../../../domain/teams/validation/createTeam.schema";
import type { CreateTeamInput } from "../../../../domain/teams/validation/createTeam.schema";
import { EntityPage } from "../../../components/EntityPage/EntityPage";
import { EntityForm } from "../../../components/EntityForm/EntityForm";
import { TextInputField } from "../../../components/TextInputField/TextInputField";

export function NewTeamPage() {
  const creation = useCreateTeam();
  const router = useRouter();
  const t = useTranslations("teams");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [season, setSeason] = useState("");
  const [invalid, setInvalid] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);

  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (submitted.current || creation.isPending) return;
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
      await creation.mutateAsync(input);
      router.replace("/app/teams");
    } catch {
      submitted.current = false;
    }
  }

  return (
    <EntityPage
      backHref="/app/teams"
      backLabel={t("back")}
      title={t("newTitle")}
      description={t("newDescription")}
      storageNotice={t("storageNotice")}
    >
      <EntityForm
        pending={creation.isPending}
        failed={creation.isError}
        failedLabel={t("saveFailed")}
        submitLabel={t(creation.isPending ? "saving" : "create")}
        cancelLabel={t("cancel")}
        cancelHref="/app/teams"
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
          disabled={creation.isPending}
          value={name}
          error={invalid ? t("nameRequired") : undefined}
          onChange={(event) => {
            setName(event.target.value);
            if (creation.isError) creation.reset();
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
          disabled={creation.isPending}
          onChange={(event) => {
            setCategory(event.target.value);
            if (creation.isError) creation.reset();
          }}
        />
        <TextInputField
          name="season"
          label={t("season")}
          requiredLabel={t("required")}
          placeholder={t("seasonPlaceholder")}
          autoComplete="off"
          value={season}
          disabled={creation.isPending}
          onChange={(event) => {
            setSeason(event.target.value);
            if (creation.isError) creation.reset();
          }}
        />
      </EntityForm>
    </EntityPage>
  );
}
