"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { useMatches } from "../../../features/matches/queries/matches.queries";
import Link from "next/link";
import { Button, Text, Title } from "@mantine/core";
import { Search, Trophy } from "lucide-react";
import { PageHeader } from "../../../components/PageHeader/PageHeader";
import { SearchToolbar } from "../../../components/SearchToolbar/SearchToolbar";
import { MatchRow } from "../../../features/matches/MatchRow/MatchRow";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { normalizeSearch } from "../../../utils/search";
import st from "./MatchesListPage.module.css";
export function MatchesListPage() {
  const t = useTranslations("matches");
  const { locale } = useLanguage();
  const query = useMatches();
  const [search, setSearch] = useState("");
  const snapshots = query.data ?? [];
  const filtered = snapshots
    .filter(({ match }) =>
      normalizeSearch(
        `${match.teamNameAtMatch} ${match.opponentName}`,
        locale,
      ).includes(normalizeSearch(search, locale)),
    )
    .sort(
      (a, b) =>
        b.match.createdAt - a.match.createdAt ||
        a.match.id.localeCompare(b.match.id),
    );
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
        actionHref="/app/matches/new"
        actionLabel={t("newTitle")}
        compactActionLabel={t("new")}
      />
      {query.isPending || query.isError ? (
        <EntityDataStatus
          loadingLabel={t("loading")}
          failedLabel={t("loadFailed")}
          retryLabel={t("retry")}
          failed={query.isError}
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : snapshots.length === 0 ? (
        <div className={st.empty}>
          <Trophy size={30} strokeWidth={1.4} aria-hidden="true" />
          <Title order={2}>{t("emptyTitle")}</Title>
          <Text>{t("emptyDescription")}</Text>
          <Button
            component={Link}
            href="/app/matches/new"
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
              {filtered.map((snapshot) => (
                <MatchRow key={snapshot.match.id} snapshot={snapshot} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
