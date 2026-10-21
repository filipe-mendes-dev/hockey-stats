"use client";
import { useTranslations } from "next-intl";
import { NumberStepper } from "../../../components/NumberStepper/NumberStepper";
import type { ScoreCorrectionFormProps } from "./ScoreCorrectionForm.interfaces";
import st from "./ScoreCorrectionForm.module.css";
export function ScoreCorrectionForm({
  formId,
  ownName,
  opponentName,
  ownScore,
  opponentScore,
  value,
  onChange,
  onApply,
}: ScoreCorrectionFormProps) {
  const t = useTranslations("recorder");
  return (
    <form
      id={formId}
      aria-label={t("score-adjustment")}
      className={st.form}
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <div className={st.scores}>
        <div className={st.ownScore}>
          <span className={st.teamName} title={ownName}>
            {ownName}
          </span>
          <output aria-label={t("ourScore")}>{ownScore}</output>
        </div>
        <NumberStepper
          label={opponentName}
          value={value}
          onChange={onChange}
          min={Math.max(0, opponentScore - 2147483647)}
          max={Math.min(Number.MAX_SAFE_INTEGER, opponentScore + 2147483647)}
        />
      </div>
      <p>{t("ownScoreReadOnly")}</p>
    </form>
  );
}
