"use client";

import { TextInput } from "@mantine/core";
import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCreatePlayer } from "../../../features/players/mutations/players.mutations";
import { createPlayerInputSchema } from "../../../../domain/players/validation/createPlayer.schema";
import type { CreatePlayerInput } from "../../../../domain/players/validation/createPlayer.schema";
import { PageHeader } from "../../../components/PageHeader/PageHeader";
import { FormLayout } from "../../../components/FormLayout/FormLayout";
import st from "./NewPlayerPage.module.css";

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
    <section className={st.page}>
      <PageHeader
        back={{ href: "/app/players", label: t("back") }}
        title={t("newTitle")}
        description={t("newDescription")}
      />
      <FormLayout
        label={t("newTitle")}
        pending={creation.isPending}
        error={creation.isError ? t("saveFailed") : null}
        submitLabel={t(creation.isPending ? "saving" : "create")}
        cancelLabel={t("cancel")}
        cancelHref="/app/players"
        actionsLayout="creation"
        onSubmit={submit}
      >
        <TextInput
          ref={nameInput}
          name="name"
          label={t("name")}
          placeholder={t("namePlaceholder")}
          autoComplete="off"
          autoCapitalize="words"
          required
          disabled={creation.isPending}
          value={name}
          error={invalid ? t("nameRequired") : undefined}
          errorProps={{ role: "alert" }}
          onChange={(event) => {
            setName(event.target.value);
            if (creation.isError) creation.reset();
            if (invalid && event.target.value.trim()) setInvalid(false);
          }}
        />
      </FormLayout>
    </section>
  );
}
