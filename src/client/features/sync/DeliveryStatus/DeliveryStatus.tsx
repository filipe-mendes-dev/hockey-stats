"use client";
import { useTranslations } from "next-intl";
import { useOutboxOperations } from "../queries/outbox.queries";
import type { DeliveryStatusProps } from "./DeliveryStatus.interfaces";
export function DeliveryStatus({ kind, entityId }: DeliveryStatusProps) {
  const t = useTranslations("sync");
  const delivery = useOutboxOperations();
  if (delivery.isPending) return null;
  if (delivery.isError) return <span>{t("deliveryUnavailable")}</span>;
  const operation = delivery.data.find(
    (entry) => entry.command.kind === kind && entry.entityId === entityId,
  );
  return (
    <span>
      {t(
        operation?.status === "blocked"
          ? "recordBlocked"
          : operation
            ? "saved"
            : "recordSynced",
      )}
    </span>
  );
}
