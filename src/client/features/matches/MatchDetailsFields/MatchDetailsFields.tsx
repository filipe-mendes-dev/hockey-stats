"use client";

import { useId } from "react";
import {
  CloseButton,
  Input,
  SegmentedControl,
  Select,
  TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import "dayjs/locale/pt";
import { createMatchInputSchema } from "../../../../domain/matches/match.schema";
import type { MatchDetailsFieldsProps } from "./MatchDetailsFields.interfaces";
import st from "./MatchDetailsFields.module.css";

export function MatchDetailsFields({
  values,
  teams,
  disabled,
  invalid,
  teamInput,
  opponentInput,
  onTeamChange,
  onChange,
}: MatchDetailsFieldsProps) {
  const t = useTranslations("matches");
  const { locale } = useLanguage();
  const venueLabelId = useId();
  return (
    <div className={st.fields}>
      <Select
        ref={teamInput}
        name="teamId"
        label={t("team")}
        placeholder={t("chooseTeam")}
        required
        searchable
        data={teams.map((team) => ({
          value: team.id,
          label: [team.name, team.category, team.season]
            .filter(Boolean)
            .join(" · "),
        }))}
        nothingFoundMessage={t("noMatchingTeams")}
        value={values.teamId || null}
        disabled={disabled}
        error={
          invalid && !teams.some((team) => team.id === values.teamId)
            ? t("teamRequired")
            : undefined
        }
        errorProps={{ role: "alert" }}
        onChange={(value) => onTeamChange(value ?? "")}
      />
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
