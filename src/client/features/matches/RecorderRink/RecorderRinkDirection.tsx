"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { HockeyRink } from "../../../components/HockeyRink/HockeyRink";
import type { RecorderRinkDirectionProps } from "./RecorderRinkDirection.interfaces";
import st from "./RecorderRinkDirection.module.css";

export function RecorderRinkDirection({
  direction,
  compact = false,
}: RecorderRinkDirectionProps) {
  const t = useTranslations("recorder");
  const left = direction === "toward-x0";
  return (
    <span className={st.preview} data-compact={compact} aria-hidden={compact}>
      <HockeyRink
        label={t("rinkDirectionPreview", {
          direction: t(left ? "attackLeft" : "attackRight"),
        })}
        orientation={{
          attackingEnd: left ? "left" : "right",
          ...(compact
            ? {}
            : { attackLabel: t("rinkAttack"), defenceLabel: t("rinkDefence") }),
        }}
      />
      <span className={st.arrow} aria-hidden="true">
        {left ? <ArrowLeft /> : <ArrowRight />}
      </span>
    </span>
  );
}
