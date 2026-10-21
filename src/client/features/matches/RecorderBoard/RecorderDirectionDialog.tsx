"use client";
import { useState } from "react";
import { SegmentedControl } from "@mantine/core";
import { useTranslations } from "next-intl";
import { matchPeriodSchema } from "../../../../domain/matches/match.schema";
import { ResponsiveFormDialog } from "../../../components/ResponsiveFormDialog/ResponsiveFormDialog";
import { useControlMatch } from "../mutations/matchControl.mutations";
import type { RecorderDirectionDialogProps } from "./RecorderDirectionDialog.interfaces";
export function RecorderDirectionDialog({
  match,
  onClose,
}: RecorderDirectionDialogProps) {
  const t = useTranslations("recorder");
  const [direction, setDirection] = useState(
    match.periods.find((period) => period.number === match.currentPeriod)
      ?.attackDirection ?? "unknown",
  );
  const mutation = useControlMatch();
  return (
    <ResponsiveFormDialog
      opened
      title={t("attackDirection")}
      closeLabel={t("cancel")}
      cancelLabel={t("cancel")}
      submitLabel={t("applyDirection")}
      pending={mutation.isPending}
      error={mutation.isError ? t("controlFailed") : null}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(
          {
            id: match.id,
            expectedRevision: match.revision,
            action: { type: "period.direction", attackDirection: direction },
          },
          { onSuccess: onClose },
        );
      }}
    >
      <SegmentedControl
        fullWidth
        radius="xl"
        value={direction}
        onChange={(value) =>
          setDirection(matchPeriodSchema.shape.attackDirection.parse(value))
        }
        disabled={mutation.isPending}
        data={[
          { value: "toward-x0", label: t("attackLeft") },
          { value: "unknown", label: t("attackUnknown") },
          { value: "toward-x1", label: t("attackRight") },
        ]}
        aria-label={t("attackDirection")}
      />
    </ResponsiveFormDialog>
  );
}
