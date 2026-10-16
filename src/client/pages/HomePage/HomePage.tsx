"use client";

import { useTranslations } from "next-intl";
import type { HomePageProps } from "./HomePage.interfaces";
import st from "./HomePage.module.css";

export function HomePage({ name }: HomePageProps) {
  const t = useTranslations("home");
  return (
    <section className={st.content}>
      <h1>{t("welcome", { name })}</h1>
      <p>{t("signedIn")}</p>
    </section>
  );
}
