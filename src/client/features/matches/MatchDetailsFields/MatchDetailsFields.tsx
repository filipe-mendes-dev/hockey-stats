"use client";

import { Select } from "@mantine/core";
import { useTranslations } from "next-intl";
import { MatchMetadataFields } from "../MatchMetadataFields/MatchMetadataFields";
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
      <MatchMetadataFields
        values={values}
        disabled={disabled}
        invalid={invalid}
        opponentInput={opponentInput}
        onChange={(metadata) => onChange({ ...values, ...metadata })}
      />
    </div>
  );
}
