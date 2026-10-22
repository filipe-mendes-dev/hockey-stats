"use client";

import { Alert, Button, Loader, Text, Title } from "@mantine/core";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader } from "../../../components/PageHeader/PageHeader";
import { PlayerActionsMenu } from "../../../features/players/PlayerActionsMenu/PlayerActionsMenu";
import { PlayerAvatar } from "../../../features/players/PlayerAvatar/PlayerAvatar";
import { PlayerMemberships } from "../../../features/players/PlayerMemberships/PlayerMemberships";
import { usePlayer } from "../../../features/players/queries/players.queries";
import { DeliveryStatus } from "../../../features/sync/DeliveryStatus/DeliveryStatus";
import st from "./PlayerDetailsPage.module.css";

export function PlayerDetailsPage() {
  const t = useTranslations("players");
  const params = useParams();
  const searchParams = useSearchParams();
  const playerId =
    searchParams.get("id") ??
    (typeof params.id === "string" ? params.id : undefined);
  const playerQuery = usePlayer(playerId);
  const player = playerQuery.isError ? null : playerQuery.data;

  return (
    <section className={st.page}>
      <PageHeader
        title={player?.name ?? t("detailsTitle")}
        back={{ href: "/app/players", label: t("back") }}
        avatar={player ? <PlayerAvatar name={player.name} size={56} /> : null}
        actions={
          player ? (
            <>
              <DeliveryStatus
                compact
                kind="player.create"
                entityId={player.id}
              />
              <PlayerActionsMenu name={player.name} />
            </>
          ) : null
        }
      />
      {playerQuery.isPending ? (
        <div className={st.loading} role="status">
          <Loader size="sm" />
          <Text>{t("loading")}</Text>
        </div>
      ) : playerQuery.isError ? (
        <Alert color="red" title={t("loadFailed")} role="alert">
          <Button
            size="sm"
            variant="subtle"
            onClick={() => {
              void playerQuery.refetch();
            }}
          >
            {t("retry")}
          </Button>
        </Alert>
      ) : player ? (
        <PlayerMemberships playerId={player.id} />
      ) : (
        <div className={st.unavailable}>
          <Title order={2}>{t("unavailableTitle")}</Title>
          <Text>{t("unavailableDescription")}</Text>
        </div>
      )}
    </section>
  );
}
