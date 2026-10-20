"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguagePicker } from "../LanguagePicker/LanguagePicker";
import type { AppHeaderProps } from "./AppHeader.interfaces";
import st from "./AppHeader.module.css";

export function AppHeader({ children }: AppHeaderProps) {
  const t = useTranslations();

  return (
    <header className={st.header}>
      <div className={st.content}>
        <Link className={st.brand} href="/app" prefetch={false}>
          <span className={st.mark} aria-hidden="true">
            <Activity size={21} strokeWidth={2} />
          </span>
          <span className={st.brandText}>
            <span className={st.name}>{t("shell.title")}</span>
            <span className={st.description}>{t("shell.description")}</span>
          </span>
        </Link>
        <div className={st.actions}>
          <div className={st.language}>
            <LanguagePicker />
          </div>
          {children}
        </div>
      </div>
    </header>
  );
}
