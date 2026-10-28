"use client";

import { SegmentedControl, Select } from "@mantine/core";
import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MatchPeriodFilterProps } from "./MatchPeriodFilter.interfaces";
import st from "./MatchPeriodFilter.module.css";

export function MatchPeriodFilter({
  periods,
  value,
  onChange,
}: MatchPeriodFilterProps) {
  const t = useTranslations("statistics");
  const matches = useTranslations("matches");
  const options = [
    { value: "all", label: t("allMatch") },
    ...periods.map((period) => ({
      value: String(period.number),
      label: matches("periodLabel", { number: period.number }),
    })),
  ];
  function change(next: string | null): void {
    if (next !== null)
      onChange(
        periods.find((period) => String(period.number) === next)?.number,
      );
  }
  const selected = value === undefined ? "all" : String(value);
  return (
    <>
      <SegmentedControl
        className={st.desktop}
        classNames={{ label: st.label }}
        fullWidth={false}
        aria-label={t("periodFilter")}
        value={selected}
        onChange={change}
        data={options}
      />
      <Select
        className={st.compact}
        aria-label={t("periodFilter")}
        leftSection={<CalendarDays size={16} aria-hidden="true" />}
        value={selected}
        onChange={change}
        data={options}
        allowDeselect={false}
      />
    </>
  );
}
