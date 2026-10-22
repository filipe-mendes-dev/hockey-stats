"use client";

import { useTranslations, useFormatter } from "next-intl";
import type { CardCountsProps } from "./CardCounts.interfaces";
import st from "./CardCounts.module.css";

export function CardCounts({ cards, showZeros = false }: CardCountsProps) {
  const t = useTranslations("statistics");
  const format = useFormatter();
  return (
    <span className={st.counts}>
      {(["yellow", "blue", "red"] as const).map((colour) =>
        cards[colour] || showZeros ? (
          <span
            key={colour}
            className={st.count}
            role="img"
            aria-label={t(colour, { count: cards[colour] })}
          >
            <i className={st.card} data-colour={colour} aria-hidden="true" />
            <span aria-hidden="true">{format.number(cards[colour])}</span>
          </span>
        ) : null,
      )}
    </span>
  );
}
