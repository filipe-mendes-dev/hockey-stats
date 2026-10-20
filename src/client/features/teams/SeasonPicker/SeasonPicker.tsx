"use client";

import { ActionIcon, TextInput } from "@mantine/core";
import { YearPickerInput } from "@mantine/dates";
import { CalendarDays, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import "dayjs/locale/pt";
import { dateFromSeason, seasonFromDate } from "./seasonFormatting";
import type { SeasonPickerProps } from "./SeasonPicker.interfaces";
import st from "./SeasonPicker.module.css";

export function SeasonPicker({ value, disabled, onChange }: SeasonPickerProps) {
  const t = useTranslations("teams");
  const { locale } = useLanguage();
  const date = dateFromSeason(value);

  if (value && !date) {
    return (
      <TextInput
        name="season"
        label={t("seasonOptional")}
        description={t("customSeasonHint")}
        autoComplete="off"
        value={value}
        disabled={disabled}
        rightSectionWidth={44}
        rightSection={
          <ActionIcon
            aria-label={t("clearSeason")}
            disabled={disabled}
            onClick={() => onChange("")}
          >
            <X size={16} aria-hidden="true" />
          </ActionIcon>
        }
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    );
  }

  return (
    <YearPickerInput
      name="season"
      label={t("seasonOptional")}
      placeholder={t("chooseSeason")}
      value={date}
      disabled={disabled}
      clearable
      clearButtonProps={{ "aria-label": t("clearSeason") }}
      leftSection={<CalendarDays size={18} aria-hidden="true" />}
      leftSectionPointerEvents="none"
      locale={locale === "pt-PT" ? "pt" : "en"}
      minDate="1000-01-01"
      maxDate="9999-12-31"
      previousLabel={t("previousYears")}
      nextLabel={t("nextYears")}
      getYearControlProps={(year) => ({
        "aria-label": t("selectSeason", { season: seasonFromDate(year) }),
      })}
      valueFormatter={({ date: selected }) =>
        typeof selected === "string" ? seasonFromDate(selected) : ""
      }
      onChange={(selected) =>
        onChange(selected ? seasonFromDate(selected) : "")
      }
      popoverProps={{
        withinPortal: false,
        middlewares: { flip: true, shift: { padding: 8, crossAxis: true } },
      }}
      classNames={{
        input: st.input,
        yearsListControl: st.year,
        calendarHeaderControl: st.navigation,
        calendarHeaderLevel: st.decade,
      }}
    />
  );
}
