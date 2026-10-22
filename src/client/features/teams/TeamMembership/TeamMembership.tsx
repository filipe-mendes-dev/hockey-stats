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
import { ResponsiveFormDialog } from "../../../components/ResponsiveFormDialog/ResponsiveFormDialog";
import { MembershipFields } from "../../../components/MembershipFields/MembershipFields";
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
  function close(): void {
    if (submitting.current || update.isPending) return;
    setDraft(null);
    update.reset();
  }

  return (
    <>
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
          <Tooltip label={t("edit")}>
            <ActionIcon
              aria-label={t("editPlayer", { name: playerName })}
              aria-haspopup="dialog"
              aria-expanded={Boolean(draft)}
              onClick={() => {
                setDraft(membership);
                update.reset();
              }}
            >
              <Pencil size={17} strokeWidth={1.6} aria-hidden="true" />
            </ActionIcon>
          </Tooltip>
        }
      >
        {duplicateNumber && (
          <p className={st.notice} role="status">
            {t("duplicate")}
          </p>
        )}
      </EntityRow>
      <ResponsiveFormDialog
        opened={Boolean(draft)}
        title={t("edit")}
        closeLabel={t("cancel")}
        cancelLabel={t("cancel")}
        submitLabel={t(update.isPending ? "saving" : "save")}
        pending={update.isPending}
        error={
          update.isError
            ? update.error instanceof LocalRevisionConflictError
              ? teamsText("changed")
              : t("failed")
            : null
        }
        onClose={close}
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        {draft && (
          <>
            <div className={st.identity}>
              <PlayerAvatar name={playerName} />
              <span>{playerName}</span>
            </div>
            <MembershipFields
              jerseyNumber={draft.jerseyNumber ?? ""}
              role={draft.role}
              disabled={update.isPending}
              onNumberChange={(jerseyNumber) =>
                setDraft({ ...draft, jerseyNumber })
              }
              onRoleChange={(role) => setDraft({ ...draft, role })}
            />
            {duplicateNumber && (
              <p className={st.notice} role="status">
                {t("duplicate")}
              </p>
            )}
          </>
        )}
      </ResponsiveFormDialog>
    </>
  );
}
