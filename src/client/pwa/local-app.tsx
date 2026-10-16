"use client";

import { useTranslations } from "next-intl";
import st from "./styles.module.css";

export function LocalApp() {
  const t = useTranslations("pwa");

  return (
    <section className={st.content}>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </section>
  );
}
