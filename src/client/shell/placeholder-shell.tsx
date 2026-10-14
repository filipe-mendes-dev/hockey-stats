"use client";

import { useTranslations } from "next-intl";
import { useLanguage } from "../i18n/provider";
import st from "./styles.module.css";

export function PlaceholderShell() {
  const t = useTranslations();
  const { locale, select } = useLanguage();

  return (
    <main className={st.shell}>
      <div className={st.language}>
        <label htmlFor="language">{t("language.label")}</label>
        <select
          id="language"
          value={locale}
          onChange={(event) => select(event.target.value)}
        >
          <option value="en">{t("language.english")}</option>
          <option value="pt-PT">{t("language.portuguese")}</option>
        </select>
      </div>
      <section className={st.content}>
        <p className={st.status}>{t("shell.status", { phase: 0 })}</p>
        <h1>{t("shell.title")}</h1>
        <p className={st.description}>{t("shell.description")}</p>
        <p>{t("shell.placeholder")}</p>
      </section>
    </main>
  );
}
