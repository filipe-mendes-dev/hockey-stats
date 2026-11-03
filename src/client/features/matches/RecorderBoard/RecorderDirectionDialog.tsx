"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ResponsiveFormDialog } from "../../../components/ResponsiveFormDialog/ResponsiveFormDialog";
import { getClockElapsed } from "../../../../domain/matches/matchControl";
import { RecorderTime } from "../RecorderContext/RecorderTime";
import { RecorderDirectionPicker } from "../RecorderRink/RecorderDirectionPicker";
import { useControlMatch } from "../mutations/matchControl.mutations";
import type { RecorderDirectionDialogProps } from "./RecorderDirectionDialog.interfaces";
export function RecorderDirectionDialog({
  match,
  onClose,
}: RecorderDirectionDialogProps) {
  const t = useTranslations("recorder");
  const [capturedElapsed] = useState(() => getClockElapsed(match, Date.now()));
  const storedDirection = match.periods.find(
    (period) => period.number === match.currentPeriod,
  )?.attackDirection;
  const [direction, setDirection] = useState<"toward-x0" | "toward-x1">(
    storedDirection === "toward-x0" ? "toward-x0" : "toward-x1",
  );
  const mutation = useControlMatch();
  return (
    <ResponsiveFormDialog
      opened
      title={t("attackDirection")}
      metadata={
        <RecorderTime
          match={match}
          period={match.currentPeriod}
          elapsedMs={capturedElapsed}
        />
      }
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
      <RecorderDirectionPicker
        direction={direction}
        onChange={setDirection}
        disabled={mutation.isPending}
      />
    </ResponsiveFormDialog>
  );
}
