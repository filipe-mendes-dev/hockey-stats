"use client";

import { EntityRow } from "../../../components/EntityRow/EntityRow";
import { DeliveryStatus } from "../../sync/DeliveryStatus/DeliveryStatus";
import { TeamMark } from "../TeamMark/TeamMark";
import type { TeamRowProps } from "./TeamRow.interfaces";

export function TeamRow({ team }: TeamRowProps) {
  return (
    <EntityRow
      title={team.name}
      description={[team.category, team.season].filter(Boolean).join(" · ")}
      href={`/app/teams/view?id=${encodeURIComponent(team.id)}`}
      avatar={<TeamMark />}
      meta={<DeliveryStatus compact kind="team.create" entityId={team.id} />}
    />
  );
}
