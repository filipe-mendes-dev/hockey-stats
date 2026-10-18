"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTeamPlayers } from "../../teams/queries/teams.queries";
import { usePlayers } from "../../players/queries/players.queries";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { SearchInputField } from "../../../components/SearchInputField/SearchInputField";
import { SelectableListItem } from "../../../components/SelectableListItem/SelectableListItem";
import { PlayerAssignmentFields } from "../../../components/PlayerAssignmentFields/PlayerAssignmentFields";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { normalizeSearch } from "../../../utils/search";
import {
  isValidMatchCallUp,
  matchCallUpLimits,
} from "../../../../domain/matches/match.schema";
import type {
  MatchPlayerSelectionProps,
  MatchPlayerChoice,
} from "./MatchPlayerSelection.interfaces";
import st from "./MatchPlayerSelection.module.css";
export function MatchPlayerSelection({
  teamId,
  existingPlayers = [],
  value,
  disabled,
  onChange,
}: MatchPlayerSelectionProps) {
  const t = useTranslations("matches");
  const assignmentText = useTranslations("teamPlayers");
  const memberships = useTeamPlayers(teamId);
  const players = usePlayers();
  const { locale } = useLanguage();
  const [search, setSearch] = useState("");
  const selected = Object.values(value);
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const available = (memberships.data ?? []).flatMap<{
    player: { id: string; name: string };
    membership: {
      role: MatchPlayerChoice["role"];
      jerseyNumber?: string | undefined;
    };
  }>((membership) => {
    const player = players.data?.find(
      (entry) => entry.id === membership.playerId,
    );
    const existing = existingPlayers.find(
      (entry) => entry.playerId === membership.playerId,
    );
    return existing
      ? [
          {
            player: { id: existing.playerId, name: existing.playerNameAtMatch },
            membership: {
              role: existing.role,
              jerseyNumber: existing.jerseyNumber,
            },
          },
        ]
      : player
        ? [{ player, membership }]
        : [];
  });
  for (const existing of existingPlayers) {
    if (!available.some((entry) => entry.player.id === existing.playerId))
      available.push({
        player: { id: existing.playerId, name: existing.playerNameAtMatch },
        membership: {
          role: existing.role,
          jerseyNumber: existing.jerseyNumber,
        },
      });
  }
  available.sort((a, b) => collator.compare(a.player.name, b.player.name));
  const filtered = available.filter(({ player }) =>
    normalizeSearch(player.name, locale).includes(
      normalizeSearch(search, locale),
    ),
  );
  const numbers = selected
    .map((player) => player.jerseyNumber.trim())
    .filter(Boolean);
  function change(id: string, fields: MatchPlayerChoice): void {
    onChange({ ...value, [id]: fields });
  }
  if (!teamId) return null;
  if (
    memberships.isPending ||
    players.isPending ||
    memberships.isError ||
    players.isError
  )
    return (
      <EntityDataStatus
        loadingLabel={t("loading")}
        failedLabel={t("loadFailed")}
        retryLabel={t("retry")}
        failed={memberships.isError || players.isError}
        onRetry={() => {
          void memberships.refetch();
          void players.refetch();
        }}
      />
    );
  return (
    <fieldset className={st.selection} disabled={disabled}>
      <legend>{t("callUp")}</legend>
      <p>{t("callUpDescription")}</p>
      <div className={st.counts} role="status">
        <span>
          {t("fieldCount", {
            count: selected.filter((player) => player.role === "field-player")
              .length,
          })}
        </span>
        <span>
          {t("keeperCount", {
            count: selected.filter((player) => player.role === "goalkeeper")
              .length,
          })}
        </span>
        <span>{t("selected", { count: selected.length })}</span>
      </div>
      {!isValidMatchCallUp(selected) && (
        <p className={st.error} role="alert">
          {t("invalidCallUp")}
        </p>
      )}
      {new Set(numbers).size !== numbers.length && (
        <p role="status">{assignmentText("duplicate")}</p>
      )}
      {available.length === 0 ? (
        <p>{t("noTeamPlayers")}</p>
      ) : (
        <>
          <SearchInputField
            label={assignmentText("search")}
            placeholder={assignmentText("search")}
            clearLabel={t("clearSearch")}
            value={search}
            onChange={setSearch}
          />
          {filtered.length === 0 && <p>{t("noMatchingPlayers")}</p>}
          <ul className={st.list}>
            {filtered.map(({ player, membership }) => {
              const choice = value[player.id];
              return (
                <SelectableListItem
                  key={player.id}
                  title={player.name}
                  description={assignmentText(membership.role)}
                  checked={!!choice}
                  disabled={
                    disabled ||
                    (!choice && selected.length >= matchCallUpLimits.total)
                  }
                  onChange={(checked) => {
                    const next = { ...value };
                    if (checked)
                      next[player.id] = {
                        jerseyNumber: membership.jerseyNumber ?? "",
                        role: membership.role,
                      };
                    else delete next[player.id];
                    onChange(next);
                  }}
                >
                  {choice && (
                    <PlayerAssignmentFields
                      jerseyNumber={choice.jerseyNumber}
                      role={choice.role}
                      disabled={disabled}
                      onNumberChange={(jerseyNumber) =>
                        change(player.id, { ...choice, jerseyNumber })
                      }
                      onRoleChange={(role) =>
                        change(player.id, { ...choice, role })
                      }
                    />
                  )}
                </SelectableListItem>
              );
            })}
          </ul>
        </>
      )}
    </fieldset>
  );
}
