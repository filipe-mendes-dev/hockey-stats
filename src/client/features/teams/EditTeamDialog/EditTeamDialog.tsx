"use client";

import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import { createTeamInputSchema } from "../../../../domain/teams/validation/teamInput.schema";
import type { CreateTeamInput } from "../../../../domain/teams/validation/teamInput.schema";
import { ResponsiveFormDialog } from "../../../components/ResponsiveFormDialog/ResponsiveFormDialog";
import { TeamFields } from "../TeamFields/TeamFields";
import type { TeamFieldValues } from "../TeamFields/TeamFields.interfaces";
import { useUpdateTeam } from "../mutations/teams.mutations";
import { LocalRevisionConflictError } from "../teams.errors";
import type { EditTeamDialogProps } from "./EditTeamDialog.interfaces";

export function EditTeamDialog({ team, onClose }: EditTeamDialogProps) {
  const t = useTranslations("teams");
  const update = useUpdateTeam();
  const [fields, setFields] = useState<TeamFieldValues>({
    name: team.name,
    category: team.category ?? "",
    season: team.season ?? "",
  });
  const [invalid, setInvalid] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);

  function close(): void {
    if (!submitted.current && !update.isPending) onClose();
  }

  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (submitted.current || update.isPending) return;
    const input = createTeamInputSchema.safeParse(fields);
    if (!input.success) {
      setInvalid(true);
      nameInput.current?.focus();
      return;
    }
    submitted.current = true;
    void save(input.data);
  }

  async function save(input: CreateTeamInput): Promise<void> {
    try {
      await update.mutateAsync({
        ...input,
        id: team.id,
        expectedRevision: team.revision,
      });
      onClose();
    } catch {
      // Keep the draft and captured revision available after a failed save.
    } finally {
      submitted.current = false;
    }
  }

  return (
    <ResponsiveFormDialog
      opened
      title={t("edit")}
      closeLabel={t("cancel")}
      cancelLabel={t("cancel")}
      submitLabel={t(update.isPending ? "saving" : "save")}
      pending={update.isPending}
      error={
        update.isError
          ? update.error instanceof LocalRevisionConflictError
            ? t("changed")
            : t("saveFailed")
          : null
      }
      onClose={close}
      onSubmit={submit}
    >
      <TeamFields
        values={fields}
        disabled={update.isPending}
        invalidName={invalid}
        nameInputRef={nameInput}
        onChange={(values) => {
          setFields(values);
          if (invalid && values.name.trim()) setInvalid(false);
        }}
      />
    </ResponsiveFormDialog>
  );
}
