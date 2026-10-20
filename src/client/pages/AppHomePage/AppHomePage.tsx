"use client";

import { useTranslations } from "next-intl";
import { AppMenu } from "../../components/AppMenu/AppMenu";
import type { AppMenuItem } from "../../components/AppMenu/AppMenu.interfaces";
import st from "./AppHomePage.module.css";

export function AppHomePage() {
  const t = useTranslations("appHome");
  const items: AppMenuItem[] = [
    {
      id: "players",
      title: t("players"),
      description: t("playersDescription"),
      href: "/app/players",
    },
    {
      id: "teams",
      title: t("teams"),
      description: t("teamsDescription"),
      href: "/app/teams",
    },
    {
      id: "matches",
      title: t("matches"),
      description: t("matchesDescription"),
      href: "/app/matches",
    },
  ];

  return (
    <section className={st.page}>
      <header className={st.header}>
        <h1>{t("title")}</h1>
        <p>{t("description")}</p>
      </header>
      <AppMenu
        label={t("navigationLabel")}
        comingSoonLabel={t("comingSoon")}
        items={items}
      />
    </section>
  );
}
