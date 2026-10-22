"use client";

import { useState } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DeleteEntityDialog } from "../DeleteEntityDialog/DeleteEntityDialog";
import type { DeleteEntityActionProps } from "./DeleteEntityAction.interfaces";
import type { DeletionTarget } from "../DeleteEntityDialog/DeleteEntityDialog.interfaces";
import st from "./DeleteEntityAction.module.css";

export function DeleteEntityAction({
  target,
  redirectHref,
}: DeleteEntityActionProps) {
  const [draft, setDraft] = useState<DeletionTarget | null>(null);
  const router = useRouter();
  const t = useTranslations("removal");
  const label = target.live ? t("discardLive") : t(`actions.${target.feature}`);
  return (
    <>
      <Tooltip label={label}>
        <ActionIcon
          className={st.action}
          color="red"
          aria-label={t("actionFor", { action: label, name: target.name })}
          aria-haspopup="dialog"
          aria-expanded={Boolean(draft)}
          onClick={() => setDraft(target)}
        >
          <Trash2 size={17} strokeWidth={1.6} aria-hidden="true" />
        </ActionIcon>
      </Tooltip>
      {draft && (
        <DeleteEntityDialog
          target={draft}
          onClose={() => setDraft(null)}
          onDeleted={() => {
            if (redirectHref) router.replace(redirectHref);
          }}
        />
      )}
    </>
  );
}
