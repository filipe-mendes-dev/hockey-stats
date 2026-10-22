"use client";

import { useId } from "react";
import { Progress } from "@mantine/core";
import { useFormatter } from "next-intl";
import type {
  StatisticsBreakdownProps,
  StatisticsTone,
} from "./StatisticsBreakdown.interfaces";
import st from "./StatisticsBreakdown.module.css";

const colours: Record<StatisticsTone, string> = {
  action: "var(--color-action)",
  blue: "var(--color-card-blue)",
  muted: "var(--color-text-muted)",
  yellow: "var(--color-card-yellow)",
  red: "var(--color-card-red)",
};

export function StatisticsBreakdown({
  title,
  totalLabel,
  segments,
}: StatisticsBreakdownProps) {
  const heading = useId();
  const format = useFormatter();
  const total = segments.reduce((value, segment) => value + segment.value, 0);
  return (
    <section aria-labelledby={heading}>
      <div className={st.heading}>
        <h4 id={heading}>{title}</h4>
        <span>{totalLabel}</span>
      </div>
      <Progress.Root size={7} className={st.track} aria-label={title}>
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <Progress.Section
              key={segment.id}
              value={total ? (segment.value / total) * 100 : 0}
              color={colours[segment.tone]}
              aria-label={segment.label}
            />
          ))}
      </Progress.Root>
      <dl className={st.labels}>
        {segments.map((segment) => (
          <div key={segment.id}>
            <dt>
              <i
                className={st.swatch}
                data-tone={segment.tone}
                aria-hidden="true"
              />
              {segment.label}
            </dt>
            <dd>{format.number(segment.value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
