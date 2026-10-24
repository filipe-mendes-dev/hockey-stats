"use client";

import { useTranslations } from "next-intl";
import { RecorderRinkPicker } from "./RecorderRinkPicker";
import type { RecorderRinkProps } from "./RecorderRink.interfaces";
import st from "./RecorderRink.module.css";

export function RecorderRink({ inert, ...picker }: RecorderRinkProps) {
  const t = useTranslations("recorder");
  return (
    <section className={st.desktop} aria-label={t("rinkTitle")} inert={inert}>
      <RecorderRinkPicker {...picker} purpose="register" />
    </section>
  );
}
