"use client";

import { useTranslations } from "next-intl";
import st from "./styles.module.css";

interface HomeContentProps {
  name: string;
}

export function HomeContent({ name }: HomeContentProps) {
  const t = useTranslations("home");
  return (
    <section className={st.content}>
      <h1>{t("welcome", { name })}</h1>
      <p>{t("signedIn")}</p>
    </section>
  );
}
