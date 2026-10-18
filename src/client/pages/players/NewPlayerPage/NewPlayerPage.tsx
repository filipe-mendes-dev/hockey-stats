"use client";

import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreatePlayer } from "../../../features/players/mutations/players.mutations";
import { createPlayerInputSchema } from "../../../../domain/players/validation/createPlayer.schema";
import type { CreatePlayerInput } from "../../../../domain/players/validation/createPlayer.schema";
import { Button, ButtonLink } from "../../../components/Button/Button";
import { TextInputField } from "../../../components/TextInputField/TextInputField";
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
      <Link prefetch={false} className={st.back} href="/app/players">
        {t("back")}
      </Link>
      <header className={st.pageHeader}>
        <h1>{t("newTitle")}</h1>
        <p>{t("newDescription")}</p>
      </header>
      <form
        className={st.form}
        noValidate
        onSubmit={submit}
        aria-busy={creation.isPending}
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
        {creation.isError && (
          <p className={st.error} role="alert">
            {t("saveFailed")}
          </p>
        )}
        <div className={st.formActions}>
          <Button type="submit" disabled={creation.isPending}>
            {t(creation.isPending ? "saving" : "create")}
          </Button>
          <ButtonLink variant="secondary" href="/app/players">
            {t("cancel")}
          </ButtonLink>
        </div>
      </form>
      <p className={st.storageNotice}>{t("storageNotice")}</p>
    </section>
  );
}
