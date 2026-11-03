"use client";

import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import { AppMenu } from "../../components/AppMenu/AppMenu";
import { NavigationCard } from "../../components/NavigationCard/NavigationCard";
import type { AppMenuItem } from "../../components/AppMenu/AppMenu.interfaces";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { getNavigationDestinations } from "../../components/AppNavigation/navigation";
import { authClient } from "../../features/auth/auth-client";
import st from "./AppHomePage.module.css";

export function AppHomePage() {
  const t = useTranslations("appHome");
  const { data: session } = authClient.useSession();
  const destinations = getNavigationDestinations(
    session?.user.role === "admin" && !session.user.banned,
  );
  const items: AppMenuItem[] = destinations.flatMap(
    ({ id, href, icon: Icon }) => {
      if (id === "home") return [];
      return [
        {
          id,
          href,
          title: t(id),
          description: t(`${id}Description`),
          icon: <Icon size={24} strokeWidth={1.6} />,
        },
      ];
    },
  );

  return (
    <section className={st.page}>
      <div className={st.introduction}>
        <PageHeader
          eyebrow={t("title")}
          title={t("welcome")}
          description={t("description")}
        />
      </div>
      <NavigationCard
        featured
        title={t("recordMatch")}
        description={t("recordMatchDescription")}
        href="/app/matches/new"
        icon={<Play size={29} strokeWidth={0} fill="currentColor" />}
      />
      <AppMenu label={t("navigationLabel")} items={items} />
    </section>
  );
}
