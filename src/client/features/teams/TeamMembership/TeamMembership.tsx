"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { TeamPlayer } from "../../../../domain/teams/teamPlayer.schema";
import { useUpdateTeamPlayer } from "../mutations/teams.mutations";
import { LocalRevisionConflictError } from "../teams.errors";
import { ActionIcon, Tooltip } from "@mantine/core";
import { Pencil } from "lucide-react";
import { EntityRow } from "../../../components/EntityRow/EntityRow";
import { PlayerAvatar } from "../../players/PlayerAvatar/PlayerAvatar";
import { EntityForm } from "../../../components/EntityForm/EntityForm";
import { PlayerAssignmentFields } from "../../../components/PlayerAssignmentFields/PlayerAssignmentFields";
import { DeliveryStatus } from "../../sync/DeliveryStatus/DeliveryStatus";
import type { TeamMembershipProps } from "./TeamMembership.interfaces";
import st from "./TeamMembership.module.css";
export function TeamMembership({
  membership,
  playerName,
  duplicateNumber,
}: TeamMembershipProps) {
  const t = useTranslations("teamPlayers");
  const teamsText = useTranslations("teams");
  const update = useUpdateTeamPlayer();
  const [draft, setDraft] = useState<TeamPlayer | null>(null);
  const submitting = useRef(false);
  async function save(): Promise<void> {
    if (!draft || submitting.current) return;
    submitting.current = true;
    try {
      await update.mutateAsync({
        id: draft.id,
        expectedRevision: draft.revision,
        jerseyNumber: draft.jerseyNumber,
        role: draft.role,
      });
      setDraft(null);
    } catch {
      /* Preserve the draft so a failed save does not discard input. */
    } finally {
      submitting.current = false;
    }
  }
  return (
    <EntityRow
      title={playerName}
      href={`/app/players/view?id=${encodeURIComponent(membership.playerId)}`}
      avatar={<PlayerAvatar name={playerName} />}
      description={[
        t(membership.role),
        membership.jerseyNumber ? `#${membership.jerseyNumber}` : null,
      ]
        .filter(Boolean)
        .join(" · ")}
      meta={
        <DeliveryStatus
          compact
          kind="teamPlayer.create"
          entityId={membership.id}
        />
      }
      actions={
        !draft ? (
          <Tooltip label={t("edit")}>
            <ActionIcon
              aria-label={t("editPlayer", { name: playerName })}
              onClick={() => {
                setDraft(membership);
                update.reset();
              }}
            >
              <Pencil size={17} strokeWidth={1.6} aria-hidden="true" />
            </ActionIcon>
          </Tooltip>
        ) : null
      }
    >
      {duplicateNumber || draft ? (
        <>
          {duplicateNumber && (
            <p className={st.notice} role="status">
              {t("duplicate")}
            </p>
          )}
          {draft && (
            <div className={st.editor}>
              <EntityForm
                pending={update.isPending}
                failed={update.isError}
                failedLabel={
                  update.error instanceof LocalRevisionConflictError
                    ? teamsText("changed")
                    : t("failed")
                }
                submitLabel={t(update.isPending ? "saving" : "save")}
                cancelLabel={t("cancel")}
                cancelHref={`/app/teams/view?id=${membership.teamId}`}
                onCancel={() => {
                  setDraft(null);
                  update.reset();
                }}
                onSubmit={(event) => {
                  event.preventDefault();
                  void save();
                }}
              >
                <PlayerAssignmentFields
                  jerseyNumber={draft.jerseyNumber ?? ""}
                  role={draft.role}
                  disabled={update.isPending}
                  onNumberChange={(jerseyNumber) =>
                    setDraft({ ...draft, jerseyNumber })
                  }
                  onRoleChange={(role) => setDraft({ ...draft, role })}
                />
              </EntityForm>
            </div>
          )}
        </>
      ) : null}
    </EntityRow>
  );
}
