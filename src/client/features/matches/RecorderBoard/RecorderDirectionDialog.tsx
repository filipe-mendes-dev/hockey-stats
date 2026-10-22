"use client";
import { useState } from "react";
import { SegmentedControl } from "@mantine/core";
import { useTranslations } from "next-intl";
import st from "./RecorderDirectionDialog.module.css";
import { ResponsiveFormDialog } from "../../../components/ResponsiveFormDialog/ResponsiveFormDialog";
import { getClockElapsed } from "../../../../domain/matches/matchControl";
import { RecorderContext } from "../RecorderContext/RecorderContext";
import { RecorderRinkDirection } from "../RecorderRink/RecorderRinkDirection";
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
      <RecorderContext
        match={match}
        period={match.currentPeriod}
        elapsedMs={capturedElapsed}
        primary={t("attackDirection")}
      />
      <RecorderRinkDirection direction={direction} />
      <SegmentedControl
        fullWidth
        radius="xl"
        value={direction}
        onChange={(value) => {
          if (value === "toward-x0" || value === "toward-x1")
            setDirection(value);
        }}
        disabled={mutation.isPending}
        classNames={{ label: st.label }}
        data={[
          { value: "toward-x0", label: t("attackLeft") },
          { value: "toward-x1", label: t("attackRight") },
        ]}
        aria-label={t("attackDirection")}
      />
    </ResponsiveFormDialog>
  );
}
