"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { usePlayers } from "../../players/queries/players.queries";
import { useTeamPlayers } from "../queries/teams.queries";
import { useAddTeamPlayers } from "../mutations/teams.mutations";
import { Button } from "../../../components/Button/Button";
import { SearchInputField } from "../../../components/SearchInputField/SearchInputField";
import { SelectableListItem } from "../../../components/SelectableListItem/SelectableListItem";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { TeamPlayerFields } from "../TeamPlayerFields/TeamPlayerFields";
import { TeamMembership } from "../TeamMembership/TeamMembership";
import { normalizeSearch } from "../../../utils/search";
import type {
  TeamPlayersProps,
  PlayerSelection,
} from "./TeamPlayers.interfaces";
import st from "./TeamPlayers.module.css";
export function TeamPlayers({ teamId }: TeamPlayersProps) {
  const t = useTranslations("teamPlayers");
  const players = usePlayers();
  const teamPlayers = useTeamPlayers(teamId);
  const addition = useAddTeamPlayers();
  const { locale } = useLanguage();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, PlayerSelection>>({});
  const [saved, setSaved] = useState(false);
  const submitting = useRef(false);
  const members = teamPlayers.data ?? [];
  const memberIds = new Set(members.map((entry) => entry.playerId));
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const filtered = (players.data ?? [])
    .filter((player) =>
      normalizeSearch(player.name, locale).includes(
        normalizeSearch(search, locale),
      ),
    )
    .sort((a, b) => collator.compare(a.name, b.name));
  const selectedEntries = Object.entries(selected);
  const numbers = [
    ...members.map((member) => member.jerseyNumber),
    ...selectedEntries.map(([, field]) => field.jerseyNumber.trim()),
  ].filter(Boolean);
  const duplicate = new Set(numbers).size !== numbers.length;
  function change(id: string, fields: PlayerSelection): void {
    setSelected((current) => ({ ...current, [id]: fields }));
  }
  async function add(): Promise<void> {
    if (!selectedEntries.length || submitting.current) return;
    submitting.current = true;
    try {
      await addition.mutateAsync({
        teamId,
        players: selectedEntries.map(([playerId, fields]) => ({
          playerId,
          ...fields,
        })),
      });
      setSelected({});
      setSearch("");
      setAdding(false);
      setSaved(true);
    } catch {
      /* The mutation error retains all selected players and fields. */
    } finally {
      submitting.current = false;
    }
  }
  if (
    teamPlayers.isPending ||
    teamPlayers.isError ||
    players.isPending ||
    players.isError
  )
    return (
      <section className={st.players}>
        <h2>{t("title")}</h2>
        <EntityDataStatus
          loadingLabel={t("loading")}
          failedLabel={t("loadFailed")}
          retryLabel={t("retry")}
          failed={teamPlayers.isError || players.isError}
          onRetry={() => {
            void teamPlayers.refetch();
            void players.refetch();
          }}
        />
      </section>
    );
  return (
    <section className={st.players} aria-label={t("title")}>
      <h2>{t("title")}</h2>
      {saved && <p role="status">{t("saved")}</p>}
      {members.length === 0 ? (
        <p>{t("empty")}</p>
      ) : (
        <ul className={st.list}>
          {members.map((member) => (
            <TeamMembership
              key={member.id}
              membership={member}
              playerName={
                players.data?.find((player) => player.id === member.playerId)
                  ?.name ?? t("unknown")
              }
              duplicateNumber={
                !!member.jerseyNumber &&
                members.some(
                  (other) =>
                    other.id !== member.id &&
                    other.jerseyNumber === member.jerseyNumber,
                )
              }
            />
          ))}
        </ul>
      )}
      {!adding ? (
        <div>
          <Button
            onClick={() => {
              setAdding(true);
              setSaved(false);
              addition.reset();
            }}
          >
            {t("add")}
          </Button>
        </div>
      ) : (
        <div className={st.picker} aria-busy={addition.isPending}>
          <SearchInputField
            label={t("search")}
            placeholder={t("search")}
            clearLabel={t("clear")}
            value={search}
            onChange={setSearch}
          />
          <p role="status">
            {t("selected", { count: selectedEntries.length })}
          </p>
          {filtered.length === 0 && <p>{t("noMatches")}</p>}
          <ul className={st.list} aria-label={t("add")}>
            {filtered.map((player) => (
              <SelectableListItem
                key={player.id}
                title={player.name}
                checked={!!selected[player.id]}
                disabled={memberIds.has(player.id) || addition.isPending}
                {...(memberIds.has(player.id)
                  ? { description: t("member") }
                  : {})}
                onChange={(checked) => {
                  setSelected((current) => {
                    const next = { ...current };
                    if (checked)
                      next[player.id] = {
                        jerseyNumber: "",
                        role: "field-player",
                      };
                    else delete next[player.id];
                    return next;
                  });
                }}
              >
                {selected[player.id] && (
                  <TeamPlayerFields
                    jerseyNumber={selected[player.id]!.jerseyNumber}
                    role={selected[player.id]!.role}
                    disabled={addition.isPending}
                    onNumberChange={(jerseyNumber) =>
                      change(player.id, {
                        ...selected[player.id]!,
                        jerseyNumber,
                      })
                    }
                    onRoleChange={(role) =>
                      change(player.id, { ...selected[player.id]!, role })
                    }
                  />
                )}
              </SelectableListItem>
            ))}
          </ul>
          {duplicate && <p role="status">{t("duplicate")}</p>}
          {addition.isError && <p role="alert">{t("failed")}</p>}
          <div className={st.actions}>
            <Button
              disabled={addition.isPending || selectedEntries.length === 0}
              onClick={() => {
                void add();
              }}
            >
              {t(addition.isPending ? "saving" : "addSelected")}
            </Button>
            <Button
              variant="secondary"
              disabled={addition.isPending}
              onClick={() => {
                setAdding(false);
                setSelected({});
                setSearch("");
                addition.reset();
              }}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
