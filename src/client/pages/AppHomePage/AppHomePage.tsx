"use client";

import { useTranslations } from "next-intl";
import { Text, Title } from "@mantine/core";
import { Play, Shield, Trophy, UsersRound } from "lucide-react";
import { AppMenu } from "../../components/AppMenu/AppMenu";
import { NavigationCard } from "../../components/NavigationCard/NavigationCard";
import type { AppMenuItem } from "../../components/AppMenu/AppMenu.interfaces";
import st from "./AppHomePage.module.css";

export function AppHomePage() {
  const t = useTranslations("appHome");
  const items: AppMenuItem[] = [
    {
      id: "matches",
      title: t("matches"),
      description: t("matchesDescription"),
      href: "/app/matches",
      icon: <Trophy size={24} strokeWidth={1.6} />,
    },
    {
      id: "teams",
      title: t("teams"),
      description: t("teamsDescription"),
      href: "/app/teams",
      icon: <Shield size={24} strokeWidth={1.6} />,
    },
    {
      id: "players",
      title: t("players"),
      description: t("playersDescription"),
      href: "/app/players",
      icon: <UsersRound size={24} strokeWidth={1.6} />,
    },
  ];

  return (
    <section className={st.page}>
      <header className={st.header}>
        <Text className={st.eyebrow}>{t("title")}</Text>
        <Title order={1} className={st.title}>
          {t("welcome")}
        </Title>
        <Text className={st.description}>{t("description")}</Text>
      </header>
      <NavigationCard
        featured
        title={t("recordMatch")}
        description={t("recordMatchDescription")}
        href="/app/matches/new"
        icon={<Play size={29} strokeWidth={1.6} />}
      />
      <Title order={2} className={st.sectionTitle}>
        {t("quickAccess")}
      </Title>
      <AppMenu label={t("navigationLabel")} items={items} />
    </section>
  );
}
