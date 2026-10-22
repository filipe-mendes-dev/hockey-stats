"use client";

import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import Link from "next/link";
import { Alert, Button, Loader, Text, Title } from "@mantine/core";
import { Search, UsersRound } from "lucide-react";
import { PageHeader } from "../../../components/PageHeader/PageHeader";
import { SearchToolbar } from "../../../components/SearchToolbar/SearchToolbar";
import { PlayerRow } from "../../../features/players/PlayerRow/PlayerRow";
import { usePlayers } from "../../../features/players/queries/players.queries";
import { usePlayersListState } from "../../../features/players/usePlayersListState";
import { normalizeSearch } from "../../../utils/search";
import st from "./PlayersListPage.module.css";

export function PlayersListPage() {
  const playersQuery = usePlayers();
  const players = playersQuery.data ?? [];
  const { search, added, setSearch } = usePlayersListState();
  const t = useTranslations("players");
  const { locale } = useLanguage();
  const query = normalizeSearch(search, locale);
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const filtered = players
    .filter((player) => normalizeSearch(player.name, locale).includes(query))
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
        actionHref="/app/players/new"
        actionLabel={t("newPlayer")}
        compactActionLabel={t("new")}
      />
      {added && (
        <p className={st.success} role="status">
          {t("added")}
        </p>
      )}
      {playersQuery.isPending ? (
        <div className={st.loading} role="status">
          <Loader size="sm" />
          <Text>{t("loading")}</Text>
        </div>
      ) : playersQuery.isError ? (
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
              void playersQuery.refetch();
            }}
          >
            {t("retry")}
          </Button>
        </Alert>
      ) : players.length === 0 ? (
        <div className={st.empty}>
          <UsersRound size={30} strokeWidth={1.4} aria-hidden="true" />
          <Title order={2}>{t("emptyTitle")}</Title>
          <Text>{t("emptyDescription")}</Text>
          <Button
            component={Link}
            href="/app/players/new"
            prefetch={false}
            variant="subtle"
            size="sm"
          >
            {t("newPlayer")}
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
              {filtered.map((player) => (
                <PlayerRow key={player.id} player={player} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
