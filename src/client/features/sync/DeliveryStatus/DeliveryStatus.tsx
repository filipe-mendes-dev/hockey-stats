"use client";
import { Tooltip, UnstyledButton } from "@mantine/core";
import {
  CircleCheck,
  Clock,
  CloudUpload,
  TriangleAlert,
  CircleHelp,
} from "lucide-react";
import st from "./DeliveryStatus.module.css";
import { getCommandFeature } from "../../../../contracts/sync.schema";
import { getBlockingOperation } from "../dependencies";
import { useTranslations } from "next-intl";
import { useOutboxOperations } from "../queries/outbox.queries";
import type { DeliveryStatusProps } from "./DeliveryStatus.interfaces";
export function DeliveryStatus({
  compact = false,
  kind,
  entityId,
  eventId,
}: DeliveryStatusProps) {
  const t = useTranslations("sync");
  const delivery = useOutboxOperations();
  if (delivery.isPending) return null;
  const operation = delivery.data?.find(
    (entry) =>
      getCommandFeature(entry.command) === getCommandFeature({ kind }) &&
      entry.entityId === entityId &&
      (!eventId ||
        ("event" in entry.command && entry.command.event.id === eventId)),
  );
  const state = delivery.isError
    ? "unavailable"
    : operation?.status === "blocked"
      ? "blocked"
      : operation
        ? getBlockingOperation(operation, delivery.data ?? [])
          ? "waiting"
          : "saved"
        : "synced";
  const label = t(
    (
      {
        unavailable: "deliveryUnavailable",
        blocked: "recordBlocked",
        waiting: "waiting",
        saved: "saved",
        synced: "recordSynced",
      } as const
    )[state],
  );
  if (!compact) return <span>{label}</span>;
  const Icon = {
    unavailable: CircleHelp,
    blocked: TriangleAlert,
    waiting: Clock,
    saved: CloudUpload,
    synced: CircleCheck,
  }[state];
  return (
    <Tooltip label={label} events={{ hover: true, focus: true, touch: true }}>
      <UnstyledButton
        className={st.indicator}
        data-state={state}
        aria-label={label}
      >
        <Icon size={15} strokeWidth={1.6} aria-hidden="true" />
      </UnstyledButton>
    </Tooltip>
  );
}
