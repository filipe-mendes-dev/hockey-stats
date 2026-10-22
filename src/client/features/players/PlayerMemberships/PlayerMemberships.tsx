"use client";

import Link from "next/link";
import { Alert, Button, Loader, Text, Title } from "@mantine/core";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { useTeams } from "../../teams/queries/teams.queries";
import { usePlayerMemberships } from "../queries/players.queries";
import type { PlayerMembershipsProps } from "./PlayerMemberships.interfaces";
import st from "./PlayerMemberships.module.css";

export function PlayerMemberships({ playerId }: PlayerMembershipsProps) {
  const t = useTranslations("players");
  const roles = useTranslations("teamPlayers");
  const { locale } = useLanguage();
  const memberships = usePlayerMemberships(playerId);
  const teams = useTeams();
  const teamById = new Map(teams.data?.map((team) => [team.id, team]));
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const rows = [...(memberships.data ?? [])].sort((first, second) =>
    collator.compare(
      teamById.get(first.teamId)?.name ?? t("membershipTeamUnavailable"),
      teamById.get(second.teamId)?.name ?? t("membershipTeamUnavailable"),
    ),
  );

  function retry(): void {
    void memberships.refetch();
    void teams.refetch();
  }

  return (
    <section className={st.section} aria-labelledby="player-teams-title">
      <Title id="player-teams-title" order={2} className={st.heading}>
        {t("membershipsTitle")}
      </Title>
      {memberships.isError || teams.isError ? (
        <Alert color="red" title={t("membershipsFailed")} role="alert">
          <Button variant="subtle" size="sm" onClick={retry}>
            {t("retry")}
          </Button>
        </Alert>
      ) : memberships.isPending || teams.isPending ? (
        <div className={st.loading} role="status">
          <Loader size="sm" />
          <Text>{t("membershipsLoading")}</Text>
        </div>
      ) : rows.length === 0 ? (
        <Text className={st.empty}>{t("membershipsEmpty")}</Text>
      ) : (
        <ul className={st.list}>
          {rows.map((membership) => {
            const team = teamById.get(membership.teamId);
            const identity = (
              <>
                <Shield
                  size={21}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className={st.icon}
                />
                <span className={st.identity}>
                  <span className={st.name}>
                    {team?.name ?? t("membershipTeamUnavailable")}
                  </span>
                  {team ? (
                    (team.category || team.season) && (
                      <span className={st.context}>
                        {[team.category, team.season]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )
                  ) : (
                    <span className={st.context}>
                      {t("membershipTeamMissing")}
                    </span>
                  )}
                </span>
              </>
            );
            return (
              <li key={membership.id} className={st.row}>
                {team ? (
                  <Link
                    className={st.team}
                    href={`/app/teams/view?id=${encodeURIComponent(team.id)}`}
                    prefetch={false}
                  >
                    {identity}
                  </Link>
                ) : (
                  <div className={st.team}>{identity}</div>
                )}
                <div className={st.fields}>
                  {membership.jerseyNumber && (
                    <span>
                      {t("membershipNumber", {
                        number: membership.jerseyNumber,
                      })}
                    </span>
                  )}
                  <span>{roles(membership.role)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
