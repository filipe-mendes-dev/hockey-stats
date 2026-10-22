"use client";

import { Stepper } from "@mantine/core";
import { useTranslations } from "next-intl";
import type { MatchFlowProgressProps } from "./MatchFlowProgress.interfaces";
import st from "./MatchFlowProgress.module.css";

export function MatchFlowProgress({
  labels,
  compactLabels = labels,
  active,
  visited,
  disabled,
  onStepChange,
}: MatchFlowProgressProps) {
  const t = useTranslations("matches");
  return (
    <Stepper
      iconSize={32}
      className={st.progress}
      classNames={{
        steps: st.steps,
        step: st.step,
        stepBody: st.stepBody,
        separator: st.separator,
      }}
      active={active}
      onStepClick={(next) => {
        if (!disabled && next <= visited) onStepChange(next);
      }}
      aria-label={t("setupProgress")}
    >
      {labels.map((label, index) => (
        <Stepper.Step
          key={index}
          label={
            <>
              <span className={st.fullStepLabel}>{label}</span>
              <span className={st.compactStepLabel}>
                {compactLabels[index]}
              </span>
            </>
          }
          aria-label={label}
          aria-current={active === index ? "step" : undefined}
          disabled={disabled || index > visited}
          allowStepSelect={!disabled && index <= visited}
        />
      ))}
    </Stepper>
  );
}
