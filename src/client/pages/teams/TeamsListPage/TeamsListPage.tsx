"use client";

import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import Link from "next/link";
import { Alert, Button, Loader, Text, Title } from "@mantine/core";
import { Search, Shield } from "lucide-react";
import { PageHeader } from "../../../components/PageHeader/PageHeader";
import { SearchToolbar } from "../../../components/SearchToolbar/SearchToolbar";
import { TeamRow } from "../../../features/teams/TeamRow/TeamRow";
import { useTeams } from "../../../features/teams/queries/teams.queries";
import { useState } from "react";
import { normalizeSearch } from "../../../utils/search";
import st from "./TeamsListPage.module.css";

export function TeamsListPage() {
  const teamsQuery = useTeams();
  const teams = teamsQuery.data ?? [];
  const [search, setSearch] = useState("");
  const t = useTranslations("teams");
  const { locale } = useLanguage();
  const query = normalizeSearch(search, locale);
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const filtered = teams
    .filter((team) =>
      normalizeSearch(
        [team.name, team.category, team.season].filter(Boolean).join(" "),
        locale,
      ).includes(query),
    )
    .sort((first, second) => collator.compare(first.name, second.name));

  return (
    <section className={st.page}>
      <PageHeader
        title={t("title")}
        description={t("description")}
        back={{ href: "/app", label: t("backToMenu") }}
      />
      <SearchToolbar
        label={t("searchLabel")}
        placeholder={t("searchPlaceholder")}
        clearLabel={t("clearSearch")}
        value={search}
        onChange={setSearch}
        actionHref="/app/teams/new"
        actionLabel={t("newTitle")}
        compactActionLabel={t("new")}
      />
      {teamsQuery.isPending ? (
        <div className={st.loading} role="status">
          <Loader size="sm" />
          <Text>{t("loading")}</Text>
        </div>
      ) : teamsQuery.isError ? (
        <Alert
          className={st.error}
          color="red"
          title={t("loadFailed")}
          role="alert"
        >
          <Button
            variant="subtle"
            size="sm"
            onClick={() => {
              void teamsQuery.refetch();
            }}
          >
            {t("retry")}
          </Button>
        </Alert>
      ) : teams.length === 0 ? (
        <div className={st.empty}>
          <Shield size={30} strokeWidth={1.4} aria-hidden="true" />
          <Title order={2}>{t("emptyTitle")}</Title>
          <Text>{t("emptyDescription")}</Text>
          <Button
            component={Link}
            href="/app/teams/new"
            prefetch={false}
            variant="subtle"
            size="sm"
          >
            {t("newTitle")}
          </Button>
        </div>
      ) : (
        <>
          <p className={st.resultCount} role="status">
            {t("results", { count: filtered.length })}
          </p>
          {filtered.length === 0 ? (
            <div className={st.empty}>
              <Search size={30} strokeWidth={1.4} aria-hidden="true" />
              <Title order={2}>{t("noMatchesTitle")}</Title>
              <Text>{t("noMatchesDescription")}</Text>
              <Button variant="subtle" size="sm" onClick={() => setSearch("")}>
                {t("clearSearch")}
              </Button>
            </div>
          ) : (
            <ul className={st.list} aria-label={t("title")}>
              {filtered.map((team) => (
                <TeamRow key={team.id} team={team} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
