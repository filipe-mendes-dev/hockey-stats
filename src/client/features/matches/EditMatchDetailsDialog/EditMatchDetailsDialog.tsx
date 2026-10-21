"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createMatchInputSchema } from "../../../../domain/matches/match.schema";
import { ResponsiveFormDialog } from "../../../components/ResponsiveFormDialog/ResponsiveFormDialog";
import { MatchMetadataFields } from "../MatchMetadataFields/MatchMetadataFields";
import type { MatchMetadataValues } from "../MatchMetadataFields/MatchMetadataFields.interfaces";
import { useUpdateMatchSetup } from "../mutations/matches.mutations";
import {
  MatchChangedError,
  MatchReferencesUnavailableError,
} from "../matches.service";
import type { EditMatchDetailsDialogProps } from "./EditMatchDetailsDialog.interfaces";

export function EditMatchDetailsDialog({
  snapshot,
  onClose,
}: EditMatchDetailsDialogProps) {
  const t = useTranslations("matches");
  const [initial] = useState(snapshot);
  const [fields, setFields] = useState<MatchMetadataValues>({
    opponentName: initial.match.opponentName,
    scheduledDate: initial.match.scheduledDate ?? "",
    venueRole: initial.match.venueRole ?? "",
  });
  const [invalid, setInvalid] = useState(false);
  const update = useUpdateMatchSetup();
  const submitting = useRef(false);
  const opponentInput = useRef<HTMLInputElement>(null);

  async function save(): Promise<void> {
    if (submitting.current || update.isPending) return;
    const result = createMatchInputSchema
      .pick({ opponentName: true, scheduledDate: true, venueRole: true })
      .safeParse(fields);
    if (!result.success) {
      setInvalid(true);
      opponentInput.current?.focus();
      return;
    }
    submitting.current = true;
    try {
      await update.mutateAsync({
        ...result.data,
        id: initial.match.id,
        expectedRevision: initial.match.revision,
        teamId: initial.match.teamId,
        players: initial.players.map((player) => ({
          playerId: player.playerId,
          role: player.role,
          jerseyNumber: player.jerseyNumber,
        })),
      });
      onClose();
    } catch {
      submitting.current = false;
    }
  }
  return (
    <ResponsiveFormDialog
      opened
      title={t("editDetails")}
      closeLabel={t("cancel")}
      cancelLabel={t("cancel")}
      submitLabel={t(update.isPending ? "saving" : "saveDetails")}
      pending={update.isPending}
      error={
        update.isError
          ? update.error instanceof MatchChangedError
            ? t("changed")
            : update.error instanceof MatchReferencesUnavailableError
              ? t("referencesUnavailable")
              : t("saveFailed")
          : null
      }
      onClose={() => {
        if (!submitting.current && !update.isPending) onClose();
      }}
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <MatchMetadataFields
        values={fields}
        disabled={update.isPending}
        invalid={invalid}
        opponentInput={opponentInput}
        onChange={(values) => {
          setFields(values);
          if (update.isError) update.reset();
        }}
      />
    </ResponsiveFormDialog>
  );
}
