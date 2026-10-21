"use client";
import { useState } from "react";
import { Button } from "@mantine/core";
import { useTranslations } from "next-intl";
import { NumberStepper } from "../../../components/NumberStepper/NumberStepper";
import type { ScoreCorrectionFormProps } from "./ScoreCorrectionForm.interfaces";
import st from "./ScoreCorrectionForm.module.css";
export function ScoreCorrectionForm({
  ownName,
  opponentName,
  ownScore,
  opponentScore,
  onApply,
}: ScoreCorrectionFormProps) {
  const t = useTranslations("recorder");
  const [value, setValue] = useState<number | string>(opponentScore);
  const valid =
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    Math.abs(value - opponentScore) <= 2147483647 &&
    value !== opponentScore;
  return (
    <form
      className={st.form}
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onApply(Number(value) - opponentScore);
      }}
    >
      <div className={st.ownScore}>
        <span>{ownName}</span>
        <output aria-label={t("ourScore")}>{ownScore}</output>
      </div>
      <NumberStepper
        label={opponentName}
        value={value}
        onChange={setValue}
        min={Math.max(0, opponentScore - 2147483647)}
        max={Math.min(Number.MAX_SAFE_INTEGER, opponentScore + 2147483647)}
      />
      <p>{t("ownScoreReadOnly")}</p>
      <Button type="submit" disabled={!valid}>
        {t("saveScore")}
      </Button>
    </form>
  );
}
