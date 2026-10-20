"use client";

import { Shield } from "lucide-react";
import { EntityRow } from "../../../components/EntityRow/EntityRow";
import { DeliveryStatus } from "../../sync/DeliveryStatus/DeliveryStatus";
import type { TeamRowProps } from "./TeamRow.interfaces";
import st from "./TeamRow.module.css";

export function TeamRow({ team }: TeamRowProps) {
  return (
    <EntityRow
      title={team.name}
      description={[team.category, team.season].filter(Boolean).join(" · ")}
      href={`/app/teams/view?id=${encodeURIComponent(team.id)}`}
      avatar={
        <span className={st.mark}>
          <Shield size={24} strokeWidth={1.5} aria-hidden="true" />
        </span>
      }
      meta={<DeliveryStatus compact kind="team.create" entityId={team.id} />}
    />
  );
}
