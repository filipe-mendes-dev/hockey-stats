"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePlayers } from "../../players/queries/players.queries";
import { useTeamPlayers } from "../queries/teams.queries";
import { Button as MantineButton } from "@mantine/core";
import { Plus } from "lucide-react";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { TeamMembership } from "../TeamMembership/TeamMembership";
import type { TeamPlayersProps } from "./TeamPlayers.interfaces";
import { PlayerAssignmentDialog } from "../PlayerAssignmentDialog/PlayerAssignmentDialog";
import st from "./TeamPlayers.module.css";
export function TeamPlayers({ teamId }: TeamPlayersProps) {
  const t = useTranslations("teamPlayers");
  const players = usePlayers();
  const teamPlayers = useTeamPlayers(teamId);
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);
  const addButton = useRef<HTMLButtonElement>(null);
  const members = teamPlayers.data ?? [];
  function closeAssignment(): void {
    setAdding(false);
    requestAnimationFrame(() =>
      addButton.current?.focus({ preventScroll: true }),
    );
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
      <div className={st.heading}>
        <h2>{t("title")}</h2>
        <MantineButton
          ref={addButton}
          size="sm"
          aria-label={t("add")}
          aria-haspopup="dialog"
          aria-expanded={adding}
          leftSection={<Plus size={17} aria-hidden="true" />}
          onClick={() => {
            setAdding(true);
            setSaved(false);
          }}
        >
          <span className={st.addLabel}>{t("add")}</span>
          <span className={st.addCompactLabel}>{t("addShort")}</span>
        </MantineButton>
      </div>
      {saved && <p role="status">{t("saved")}</p>}
      {members.length === 0 ? (
        <p>{t("empty")}</p>
      ) : (
        <ul className={st.roster} aria-label={t("title")}>
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
      {adding && (
        <PlayerAssignmentDialog
          teamId={teamId}
          players={players.data ?? []}
          members={members}
          onClose={closeAssignment}
          onSaved={() => {
            closeAssignment();
            setSaved(true);
          }}
        />
      )}
    </section>
  );
}
