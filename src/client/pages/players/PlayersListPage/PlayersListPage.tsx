"use client";

import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { ButtonLink } from "../../../components/Button/Button";
import { SearchInputField } from "../../../components/SearchInputField/SearchInputField";
import { ListItem } from "../../../components/ListItem/ListItem";
import { usePlayers } from "../../../features/players/queries/players.queries";
import { usePlayersListState } from "../../../features/players/usePlayersListState";
import { EntityPage } from "../../../components/EntityPage/EntityPage";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { DeliveryStatus } from "../../../features/sync/DeliveryStatus/DeliveryStatus";
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
    <EntityPage
      backHref="/app"
      backLabel={t("backToMenu")}
      title={t("title")}
      description={t("description")}
      storageNotice={t("storageNotice")}
    >
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
        <EntityDataStatus
          loadingLabel={t("loading")}
          failedLabel={t("loadFailed")}
          retryLabel={t("retry")}
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
                  href={`/app/players/view?id=${encodeURIComponent(player.id)}`}
                >
                  <DeliveryStatus kind="player.create" entityId={player.id} />
                </ListItem>
              ))}
            </ul>
          )}
        </>
      )}
    </EntityPage>
  );
}
