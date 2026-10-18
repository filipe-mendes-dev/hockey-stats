"use client";

import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCreatePlayer } from "../../../features/players/mutations/players.mutations";
import { createPlayerInputSchema } from "../../../../domain/players/validation/createPlayer.schema";
import type { CreatePlayerInput } from "../../../../domain/players/validation/createPlayer.schema";
import { EntityPage } from "../../../components/EntityPage/EntityPage";
import { EntityForm } from "../../../components/EntityForm/EntityForm";
import { TextInputField } from "../../../components/TextInputField/TextInputField";

export function NewPlayerPage() {
  const creation = useCreatePlayer();
  const router = useRouter();
  const t = useTranslations("players");
  const [name, setName] = useState("");
  const [invalid, setInvalid] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);

  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (submitted.current || creation.isPending) return;
    const input = createPlayerInputSchema.safeParse({ name });
    if (!input.success) {
      setInvalid(true);
      nameInput.current?.focus();
      return;
    }
    submitted.current = true;
    void save(input.data);
  }

  async function save(input: CreatePlayerInput): Promise<void> {
    try {
      await creation.mutateAsync(input);
      router.replace("/app/players");
    } catch {
      submitted.current = false;
    }
  }

  return (
    <EntityPage
      backHref="/app/players"
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
        cancelHref="/app/players"
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
      </EntityForm>
    </EntityPage>
  );
}
