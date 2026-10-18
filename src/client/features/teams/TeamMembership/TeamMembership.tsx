"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { TeamPlayer } from "../../../../domain/teams/teamPlayer.schema";
import { useUpdateTeamPlayer } from "../mutations/teams.mutations";
import { LocalRevisionConflictError } from "../teams.errors";
import { Button, ButtonLink } from "../../../components/Button/Button";
import { EntityForm } from "../../../components/EntityForm/EntityForm";
import { TeamPlayerFields } from "../TeamPlayerFields/TeamPlayerFields";
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
    <li className={st.member}>
      <h3>
        <ButtonLink
          variant="secondary"
          href={`/app/players/view?id=${membership.playerId}`}
        >
          {playerName}
        </ButtonLink>
      </h3>
      <p>
        {t(membership.role)}
        {membership.jerseyNumber ? ` · #${membership.jerseyNumber}` : ""}
      </p>
      <DeliveryStatus kind="teamPlayer.create" entityId={membership.id} />
      {duplicateNumber && <p role="status">{t("duplicate")}</p>}
      {draft ? (
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
          <TeamPlayerFields
            jerseyNumber={draft.jerseyNumber ?? ""}
            role={draft.role}
            disabled={update.isPending}
            onNumberChange={(jerseyNumber) =>
              setDraft({ ...draft, jerseyNumber })
            }
            onRoleChange={(role) => setDraft({ ...draft, role })}
          />
        </EntityForm>
      ) : (
        <div>
          <Button
            variant="secondary"
            onClick={() => {
              setDraft(membership);
              update.reset();
            }}
          >
            {t("edit")}
          </Button>
        </div>
      )}
    </li>
  );
}
