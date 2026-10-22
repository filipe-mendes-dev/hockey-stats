"use client";

import { EntityRow } from "../../../components/EntityRow/EntityRow";
import { DeliveryStatus } from "../../sync/DeliveryStatus/DeliveryStatus";
import { PlayerActionsMenu } from "../PlayerActionsMenu/PlayerActionsMenu";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import type { PlayerRowProps } from "./PlayerRow.interfaces";

export function PlayerRow({ player }: PlayerRowProps) {
  return (
    <EntityRow
      title={player.name}
      href={`/app/players/view?id=${encodeURIComponent(player.id)}`}
      avatar={<PlayerAvatar name={player.name} />}
      meta={
        <DeliveryStatus compact kind="player.create" entityId={player.id} />
      }
      actions={<PlayerActionsMenu name={player.name} />}
    />
  );
}
