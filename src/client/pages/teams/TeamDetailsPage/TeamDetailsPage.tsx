"use client";

import { useRef, useState } from "react";
import type { Team } from "../../../../domain/teams/team.schema";
import { EditTeamDialog } from "../../../features/teams/EditTeamDialog/EditTeamDialog";
import { TeamPlayers } from "../../../features/teams/TeamPlayers/TeamPlayers";
import {
  ActionIcon,
  Alert,
  Button,
  Loader,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { Pencil } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTeam } from "../../../features/teams/queries/teams.queries";
import { PageHeader } from "../../../components/PageHeader/PageHeader";
import { TeamMark } from "../../../features/teams/TeamMark/TeamMark";
import { DeliveryStatus } from "../../../features/sync/DeliveryStatus/DeliveryStatus";
import st from "./TeamDetailsPage.module.css";

export function TeamDetailsPage() {
  const t = useTranslations("teams");
  const params = useParams();
  const searchParams = useSearchParams();
  const teamId =
    searchParams.get("id") ??
    (typeof params.id === "string" ? params.id : undefined);
  const teamQuery = useTeam(teamId);
  const [editing, setEditing] = useState<Team | null>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const team = teamQuery.isError ? null : teamQuery.data;

  function closeEditor(): void {
    setEditing(null);
    requestAnimationFrame(() =>
      editButton.current?.focus({ preventScroll: true }),
    );
  }

  return (
    <section className={st.page}>
      <PageHeader
        title={team?.name ?? t("detailsTitle")}
        back={{ href: "/app/teams", label: t("back") }}
        avatar={team ? <TeamMark size="lg" /> : null}
        description={
          team ? [team.category, team.season].filter(Boolean).join(" · ") : ""
        }
        actions={
          team ? (
            <>
              <DeliveryStatus compact kind="team.create" entityId={team.id} />
              <Tooltip label={t("edit")}>
                <ActionIcon
                  ref={editButton}
                  aria-label={t("edit")}
                  aria-haspopup="dialog"
                  aria-expanded={editing?.id === team.id}
                  onClick={() => setEditing(team)}
                >
                  <Pencil size={17} strokeWidth={1.6} aria-hidden="true" />
                </ActionIcon>
              </Tooltip>
            </>
          ) : null
        }
      />
      {editing && editing.id === team?.id && (
        <EditTeamDialog team={editing} onClose={closeEditor} />
      )}
      {teamQuery.isPending ? (
        <div className={st.loading} role="status">
          <Loader size="sm" />
          <Text>{t("loading")}</Text>
        </div>
      ) : teamQuery.isError ? (
        <Alert color="red" title={t("loadFailed")} role="alert">
          <Button
            size="sm"
            variant="subtle"
            onClick={() => {
              void teamQuery.refetch();
            }}
          >
            {t("retry")}
          </Button>
        </Alert>
      ) : team ? (
        <div className={st.content}>
          <TeamPlayers key={team.id} teamId={team.id} />
        </div>
      ) : (
        <div className={st.unavailable}>
          <Title order={2}>{t("unavailableTitle")}</Title>
          <Text>{t("unavailableDescription")}</Text>
        </div>
      )}
    </section>
  );
}
