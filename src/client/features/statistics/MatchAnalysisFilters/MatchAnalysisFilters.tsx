"use client";

import { Button, Select } from "@mantine/core";
import { ListFilter } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MatchAnalysisFiltersProps } from "./MatchAnalysisFilters.interfaces";
import st from "./MatchAnalysisFilters.module.css";

export function MatchAnalysisFilters({
  id,
  options,
  counts,
  value,
  onChange,
}: MatchAnalysisFiltersProps) {
  const t = useTranslations("statistics");
  return (
    <>
      <div
        className={st.categories}
        role="group"
        aria-label={t("categoryFilter")}
      >
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={value === option.value ? "filled" : "default"}
            aria-pressed={value === option.value}
            className={st.category}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            <span className={st.count}>{counts[option.value]}</span>
          </Button>
        ))}
      </div>
      <Select
        id={id}
        className={st.compact}
        aria-label={t("categoryFilter")}
        leftSection={<ListFilter size={16} aria-hidden="true" />}
        value={value}
        allowDeselect={false}
        data={options.map((option) => ({
          value: option.value,
          label: t("categoryOption", {
            category: option.label,
            count: counts[option.value],
          }),
        }))}
        onChange={(next) => {
          const option = options.find((entry) => entry.value === next);
          if (option) onChange(option.value);
        }}
      />
    </>
  );
}
