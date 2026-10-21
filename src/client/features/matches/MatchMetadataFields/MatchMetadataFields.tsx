"use client";

import { useId } from "react";
import { CloseButton, Input, SegmentedControl, TextInput } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import "dayjs/locale/pt";
import { createMatchInputSchema } from "../../../../domain/matches/match.schema";
import type { MatchMetadataFieldsProps } from "./MatchMetadataFields.interfaces";
import st from "./MatchMetadataFields.module.css";

export function MatchMetadataFields({
  values,
  disabled,
  invalid,
  opponentInput,
  onChange,
}: MatchMetadataFieldsProps) {
  const t = useTranslations("matches");
  const { locale } = useLanguage();
  const venueLabelId = useId();
  return (
    <div className={st.fields}>
      <TextInput
        ref={opponentInput}
        name="opponentName"
        label={t("opponent")}
        placeholder={t("opponentPlaceholder")}
        required
        autoComplete="off"
        value={values.opponentName}
        disabled={disabled}
        error={
          invalid && !values.opponentName.trim()
            ? t("opponentRequired")
            : undefined
        }
        errorProps={{ role: "alert" }}
        onChange={(event) =>
          onChange({ ...values, opponentName: event.currentTarget.value })
        }
      />
      <div className={st.optional}>
        <DatePickerInput
          name="scheduledDate"
          label={t("date")}
          placeholder={t("chooseDate")}
          value={values.scheduledDate || null}
          disabled={disabled}
          clearable
          clearButtonProps={{ "aria-label": t("clearDate") }}
          leftSection={<CalendarDays size={18} aria-hidden="true" />}
          leftSectionPointerEvents="none"
          locale={locale === "pt-PT" ? "pt" : "en"}
          valueFormat={locale === "pt-PT" ? "DD/MM/YYYY" : "MMM D, YYYY"}
          minDate="0001-01-01"
          maxDate="9999-12-31"
          previousLabel={t("previousMonth")}
          nextLabel={t("nextMonth")}
          error={
            invalid &&
            !createMatchInputSchema.shape.scheduledDate.safeParse(
              values.scheduledDate,
            ).success
              ? t("dateInvalid")
              : undefined
          }
          onChange={(value) =>
            onChange({ ...values, scheduledDate: value ?? "" })
          }
        />
        <div>
          <div className={st.venueLabel}>
            <Input.Label
              id={venueLabelId}
              labelElement="div"
              className={st.venueLabelText}
            >
              {t("venueRole")}
            </Input.Label>
            <CloseButton
              size="xs"
              aria-label={t("clearVenue")}
              disabled={disabled || !values.venueRole}
              onClick={() => onChange({ ...values, venueRole: "" })}
            />
          </div>
          <SegmentedControl
            name="venueRole"
            aria-labelledby={venueLabelId}
            value={values.venueRole}
            disabled={disabled}
            data={(["home", "away", "neutral"] as const).map((value) => ({
              value,
              label: t(value),
            }))}
            onChange={(venueRole) => onChange({ ...values, venueRole })}
          />
        </div>
      </div>
    </div>
  );
}
