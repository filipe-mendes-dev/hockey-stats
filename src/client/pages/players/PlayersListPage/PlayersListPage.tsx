"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { ButtonLink } from "../../../components/Button/Button";
import { SearchInputField } from "../../../components/SearchInputField/SearchInputField";
import { ListItem } from "../../../components/ListItem/ListItem";
import {
  usePlayers,
  usePlayerDelivery,
} from "../../../features/players/queries/players.queries";
import { usePlayersListState } from "../../../features/players/usePlayersListState";
import { PlayersDataStatus } from "../../../features/players/PlayersDataStatus/PlayersDataStatus";
import st from "./PlayersListPage.module.css";

function normalizeSearch(value: string, locale: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase(locale)
    .trim();
}

export function PlayersListPage() {
  const playersQuery = usePlayers();
  const delivery = usePlayerDelivery();
  const syncText = useTranslations("sync");
  const pending = new Map(
    delivery.data?.map((entry) => [entry.playerId, entry.status]),
  );
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
      <Link className={st.back} href="/app" prefetch={false}>
        {t("backToMenu")}
      </Link>
      <header className={st.pageHeader}>
        <h1>{t("title")}</h1>
        <p>{t("description")}</p>
      </header>
      <div className={st.toolbar}>
        <SearchInputField
          label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          clearLabel={t("clearSearch")}
          value={search}
          onChange={setSearch}
        />
        <ButtonLink href="/app/players/new">{t("new")}</ButtonLink>
      </div>
      {added && (
        <p className={st.success} role="status">
          {t("added")}
        </p>
      )}
      {playersQuery.isPending || playersQuery.isError ? (
        <PlayersDataStatus
          failed={playersQuery.isError}
          onRetry={() => {
            void playersQuery.refetch();
          }}
        />
      ) : players.length === 0 ? (
        <div className={st.empty}>
          <h2>{t("emptyTitle")}</h2>
          <p>{t("emptyDescription")}</p>
        </div>
      ) : (
        <>
          <p className={st.resultCount} role="status">
            {t("results", { count: filtered.length })}
          </p>
          {filtered.length === 0 ? (
            <div className={st.empty}>
              <h2>{t("noMatchesTitle")}</h2>
              <p>{t("noMatchesDescription")}</p>
            </div>
          ) : (
            <ul className={st.list} aria-label={t("title")}>
              {filtered.map((player) => (
                <ListItem
                  key={player.id}
                  title={player.name}
                  href={`/app/players/${encodeURIComponent(player.id)}`}
                >
                  {delivery.data &&
                    syncText(
                      pending.get(player.id) === "blocked"
                        ? "playerBlocked"
                        : pending.has(player.id)
                          ? "saved"
                          : "playerSynced",
                    )}
                </ListItem>
              ))}
            </ul>
          )}
        </>
      )}
      <p className={st.storageNotice}>{t("storageNotice")}</p>
    </section>
  );
}
