"use client";

import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ResponsiveFormDialog } from "../../../components/ResponsiveFormDialog/ResponsiveFormDialog";
import { LocalRevisionConflictError } from "../../teams/teams.errors";
import { deleteEntity } from "../removal.service";
import type { DeleteEntityDialogProps } from "./DeleteEntityDialog.interfaces";
import st from "./DeleteEntityDialog.module.css";

export function DeleteEntityDialog({
  target,
  onClose,
  onDeleted,
}: DeleteEntityDialogProps) {
  const t = useTranslations("removal");
  const client = useQueryClient();
  const submitting = useRef(false);
  const deletion = useMutation({
    mutationFn: deleteEntity,
    networkMode: "always",
    retry: false,
  });
  const label = target.live ? t("discardLive") : t(`actions.${target.feature}`);

  async function confirm(): Promise<void> {
    if (submitting.current || deletion.isPending) return;
    submitting.current = true;
    try {
      await deletion.mutateAsync({
        feature: target.feature,
        id: target.id,
        expectedRevision: target.expectedRevision,
      });
      for (const feature of [
        "players",
        "teams",
        "teamPlayers",
        "matches",
        "outbox",
      ])
        void client.invalidateQueries({ queryKey: [feature] });
      onDeleted?.();
      onClose();
    } catch {
      // Retain the confirmation and failure feedback for retry.
    } finally {
      submitting.current = false;
    }
  }

  return (
    <ResponsiveFormDialog
      opened
      title={label}
      closeLabel={t("cancel")}
      cancelLabel={t("cancel")}
      submitLabel={label}
      destructive
      pending={deletion.isPending}
      error={
        deletion.isError
          ? t(
              deletion.error instanceof LocalRevisionConflictError
                ? "changed"
                : "failed",
            )
          : null
      }
      onClose={() => {
        if (!submitting.current && !deletion.isPending) onClose();
      }}
      onSubmit={(event) => {
        event.preventDefault();
        void confirm();
      }}
    >
      <p className={st.name}>{target.name}</p>
      <p className={st.description}>
        {target.live
          ? t("liveDescription")
          : t(`descriptions.${target.feature}`)}
      </p>
    </ResponsiveFormDialog>
  );
}
