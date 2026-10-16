"use client";

import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePlayersPreview } from "../../../features/players/PlayersPreviewProvider";
import { Button, ButtonLink } from "../../../components/Button/Button";
import { TextInputField } from "../../../components/TextInputField/TextInputField";
import st from "./NewPlayerPage.module.css";

export function NewPlayerPage() {
  const { addPlayer } = usePlayersPreview();
  const router = useRouter();
  const t = useTranslations("players");
  const [name, setName] = useState("");
  const [invalid, setInvalid] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);

  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (submitted.current) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setInvalid(true);
      nameInput.current?.focus();
      return;
    }
    submitted.current = true;
    addPlayer(trimmedName);
    router.replace("/app/players");
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
      <form className={st.form} noValidate onSubmit={submit}>
        <TextInputField
          inputRef={nameInput}
          name="name"
          label={t("name")}
          requiredLabel={t("required")}
          placeholder={t("namePlaceholder")}
          autoComplete="off"
          autoCapitalize="words"
          required
          value={name}
          error={invalid ? t("nameRequired") : undefined}
          onChange={(event) => {
            setName(event.target.value);
            if (invalid && event.target.value.trim()) setInvalid(false);
          }}
        />
        <div className={st.formActions}>
          <Button type="submit">{t("create")}</Button>
          <ButtonLink variant="secondary" href="/app/players">
            {t("cancel")}
          </ButtonLink>
        </div>
      </form>
      <p className={st.preview}>{t("previewNotice")}</p>
    </section>
  );
}
