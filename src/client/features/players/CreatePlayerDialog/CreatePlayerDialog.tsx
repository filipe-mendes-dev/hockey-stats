"use client";

import { useTranslations } from "next-intl";
import { ResponsiveFormDialog } from "../../../components/ResponsiveFormDialog/ResponsiveFormDialog";
import { PlayerNameField } from "../PlayerNameField/PlayerNameField";
import { usePlayerCreation } from "../usePlayerCreation";
import st from "./CreatePlayerDialog.module.css";
import type { CreatePlayerDialogProps } from "./CreatePlayerDialog.interfaces";

export function CreatePlayerDialog({
  onClose,
  onCreated,
}: CreatePlayerDialogProps) {
  const t = useTranslations("players");
  const { creation, name, invalid, nameInput, changeName, submit } =
    usePlayerCreation(onCreated);
  return (
    <ResponsiveFormDialog
      opened
      title={t("newTitle")}
      closeLabel={t("cancel")}
      cancelLabel={t("cancel")}
      submitLabel={t(creation.isPending ? "saving" : "create")}
      pending={creation.isPending}
      error={creation.isError ? t("saveFailed") : null}
      onClose={onClose}
      onSubmit={submit}
    >
      <div className={st.fields}>
        <PlayerNameField
          value={name}
          disabled={creation.isPending}
          invalid={invalid}
          inputRef={nameInput}
          onChange={changeName}
        />
      </div>
    </ResponsiveFormDialog>
  );
}
