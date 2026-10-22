"use client";

import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import { createPlayerInputSchema } from "../../../../domain/players/validation/createPlayer.schema";
import { ResponsiveFormDialog } from "../../../components/ResponsiveFormDialog/ResponsiveFormDialog";
import { PlayerNameField } from "../PlayerNameField/PlayerNameField";
import { useUpdatePlayer } from "../mutations/players.mutations";
import { PlayerChangedError } from "../players.errors";
import type { EditPlayerDialogProps } from "./EditPlayerDialog.interfaces";
import st from "./EditPlayerDialog.module.css";

export function EditPlayerDialog({ player, onClose }: EditPlayerDialogProps) {
  const t = useTranslations("players");
  const update = useUpdatePlayer();
  const [name, setName] = useState(player.name);
  const [invalid, setInvalid] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);

  function close(): void {
    if (!submitted.current && !update.isPending) onClose();
  }

  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (submitted.current || update.isPending) return;
    const input = createPlayerInputSchema.safeParse({ name });
    if (!input.success) {
      setInvalid(true);
      nameInput.current?.focus();
      return;
    }
    submitted.current = true;
    void save(input.data.name);
  }

  async function save(nextName: string): Promise<void> {
    try {
      await update.mutateAsync({
        id: player.id,
        expectedRevision: player.revision,
        name: nextName,
      });
      onClose();
    } catch {
      // Keep the name and captured revision available for retry or cancellation.
    } finally {
      submitted.current = false;
    }
  }

  return (
    <ResponsiveFormDialog
      opened
      title={t("editTitle")}
      closeLabel={t("cancel")}
      cancelLabel={t("cancel")}
      submitLabel={t(update.isPending ? "saving" : "save")}
      pending={update.isPending}
      error={
        update.isError
          ? t(
              update.error instanceof PlayerChangedError
                ? "changed"
                : "updateFailed",
            )
          : null
      }
      onClose={close}
      onSubmit={submit}
    >
      <div className={st.fields}>
        <PlayerNameField
          value={name}
          disabled={update.isPending}
          invalid={invalid}
          inputRef={nameInput}
          onChange={(value) => {
            setName(value);
            if (invalid && value.trim()) setInvalid(false);
            if (update.isError) update.reset();
          }}
        />
      </div>
    </ResponsiveFormDialog>
  );
}
