"use client";
import { useState } from "react";
import { Button } from "@mantine/core";
import { useTranslations } from "next-intl";
import { DurationCounter } from "../../../components/DurationCounter/DurationCounter";
import {
  getDurationFields,
  parseDurationFields,
} from "../../../components/DurationCounter/durationFields";
import type { EventTimeFormProps } from "./EventTimeForm.interfaces";
import st from "./EventTimeForm.module.css";
export function EventTimeForm({ durationMs, onApply }: EventTimeFormProps) {
  const t = useTranslations("recorder");
  const [value, setValue] = useState(() => getDurationFields(durationMs ?? 0));
  const remaining = parseDurationFields(value, durationMs);
  return (
    <form
      className={st.form}
      onSubmit={(event) => {
        event.preventDefault();
        if (remaining !== null)
          onApply(
            durationMs === undefined ? remaining : durationMs - remaining,
          );
      }}
    >
      {durationMs === undefined && <p>{t("adjustElapsed")}</p>}
      <DurationCounter
        value={value}
        onChange={setValue}
        maxMs={durationMs}
        minutesLabel={t("minutes")}
        secondsLabel={t("seconds")}
      />
      <Button type="submit" disabled={remaining === null}>
        {t("useTime")}
      </Button>
    </form>
  );
}
