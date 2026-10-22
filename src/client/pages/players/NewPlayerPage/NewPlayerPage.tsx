"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { usePlayerCreation } from "../../../features/players/usePlayerCreation";
import { PlayerNameField } from "../../../features/players/PlayerNameField/PlayerNameField";
import { PageHeader } from "../../../components/PageHeader/PageHeader";
import { FormLayout } from "../../../components/FormLayout/FormLayout";
import st from "./NewPlayerPage.module.css";

export function NewPlayerPage() {
  const router = useRouter();
  const t = useTranslations("players");
  const { creation, name, invalid, nameInput, changeName, submit } =
    usePlayerCreation(() => router.replace("/app/players"));

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
        <PlayerNameField
          value={name}
          disabled={creation.isPending}
          invalid={invalid}
          inputRef={nameInput}
          onChange={changeName}
        />
      </FormLayout>
    </section>
  );
}
