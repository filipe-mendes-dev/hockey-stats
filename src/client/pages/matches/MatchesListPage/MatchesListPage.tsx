"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { useMatches } from "../../../features/matches/queries/matches.queries";
import { formatMatchDate } from "../../../features/matches/date";
import { EntityPage } from "../../../components/EntityPage/EntityPage";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { ListItem } from "../../../components/ListItem/ListItem";
import { ButtonLink } from "../../../components/Button/Button";
import { SearchInputField } from "../../../components/SearchInputField/SearchInputField";
import { DeliveryStatus } from "../../../features/sync/DeliveryStatus/DeliveryStatus";
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
        <ButtonLink href="/app/matches/new">{t("new")}</ButtonLink>
      </div>
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
          <h2>{t("emptyTitle")}</h2>
          <p>{t("emptyDescription")}</p>
        </div>
      ) : (
        <>
          <p role="status">{t("results", { count: filtered.length })}</p>
          {filtered.length === 0 ? (
            <div className={st.empty}>
              <h2>{t("noMatchesTitle")}</h2>
              <p>{t("noMatchesDescription")}</p>
            </div>
          ) : (
            <ul className={st.list}>
              {filtered.map(({ match, players }) => (
                <ListItem
                  key={match.id}
                  title={`${match.teamNameAtMatch} · ${match.opponentName}`}
                  href={`/app/matches/view?id=${match.id}`}
                >
                  <p>
                    {[
                      match.scheduledDate
                        ? formatMatchDate(match.scheduledDate, locale)
                        : undefined,
                      match.venueRole ? t(match.venueRole) : undefined,
                      t(match.status),
                      t("selected", { count: players.length }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <DeliveryStatus kind="match.create" entityId={match.id} />
                </ListItem>
              ))}
            </ul>
          )}
        </>
      )}
    </EntityPage>
  );
}
