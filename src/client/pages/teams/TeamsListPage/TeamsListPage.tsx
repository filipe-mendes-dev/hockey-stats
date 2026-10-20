"use client";

import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { ButtonLink } from "../../../components/Button/Button";
import { SearchInputField } from "../../../components/SearchInputField/SearchInputField";
import { ListItem } from "../../../components/ListItem/ListItem";
import { useTeams } from "../../../features/teams/queries/teams.queries";
import { useState } from "react";
import { EntityPage } from "../../../components/EntityPage/EntityPage";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { DeliveryStatus } from "../../../features/sync/DeliveryStatus/DeliveryStatus";
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
        <ButtonLink href="/app/teams/new">{t("new")}</ButtonLink>
      </div>
      {teamsQuery.isPending || teamsQuery.isError ? (
        <EntityDataStatus
          loadingLabel={t("loading")}
          failedLabel={t("loadFailed")}
          retryLabel={t("retry")}
          failed={teamsQuery.isError}
          onRetry={() => {
            void teamsQuery.refetch();
          }}
        />
      ) : teams.length === 0 ? (
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
              {filtered.map((team) => (
                <ListItem
                  key={team.id}
                  title={team.name}
                  href={`/app/teams/view?id=${encodeURIComponent(team.id)}`}
                >
                  <p className={st.metadata}>
                    {[team.category, team.season].filter(Boolean).join(" · ")}
                  </p>
                  <DeliveryStatus kind="team.create" entityId={team.id} />
                </ListItem>
              ))}
            </ul>
          )}
        </>
      )}
    </EntityPage>
  );
}
