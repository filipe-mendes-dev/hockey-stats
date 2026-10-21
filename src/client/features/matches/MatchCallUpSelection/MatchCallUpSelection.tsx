"use client";

import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { SearchField } from "../../../components/SearchField/SearchField";
import { SelectableEntityRow } from "../../../components/SelectableEntityRow/SelectableEntityRow";
import { PlayerAvatar } from "../../players/PlayerAvatar/PlayerAvatar";
import { normalizeSearch } from "../../../utils/search";
import { matchCallUpLimits } from "../../../../domain/matches/match.schema";
import type { MatchCallUpSelectionProps } from "./MatchCallUpSelection.interfaces";
import st from "./MatchCallUpSelection.module.css";

export function MatchCallUpSelection({
  available,
  selected,
  search,
  disabled,
  onSearchChange,
  onToggle,
}: MatchCallUpSelectionProps) {
  const t = useTranslations("matches");
  const assignment = useTranslations("teamPlayers");
  const { locale } = useLanguage();
  const filtered = available.filter((player) =>
    normalizeSearch(player.name, locale).includes(
      normalizeSearch(search, locale),
    ),
  );
  return (
    <div className={st.selection}>
      <SearchField
        label={assignment("search")}
        placeholder={assignment("search")}
        clearLabel={t("clearSearch")}
        value={search}
        onChange={onSearchChange}
      />
      {available.length === 0 ? (
        <p className={st.notice} role="status">
          {t("noTeamPlayers")}
        </p>
      ) : filtered.length === 0 ? (
        <p className={st.notice} role="status">
          {t("noMatchingPlayers")}
        </p>
      ) : (
        <ul className={st.list} aria-label={t("callUp")}>
          {filtered.map((player) => (
            <SelectableEntityRow
              key={player.playerId}
              title={player.name}
              avatar={<PlayerAvatar name={player.name} />}
              description={[
                assignment((selected[player.playerId] ?? player).role),
                (selected[player.playerId] ?? player).jerseyNumber
                  ? `#${(selected[player.playerId] ?? player).jerseyNumber}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              checked={Boolean(selected[player.playerId])}
              disabled={
                disabled ||
                (!selected[player.playerId] &&
                  Object.keys(selected).length >= matchCallUpLimits.total)
              }
              onChange={(checked) => onToggle(player, checked)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
