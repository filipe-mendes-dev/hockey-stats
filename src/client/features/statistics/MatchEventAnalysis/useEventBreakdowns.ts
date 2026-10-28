import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { MatchSnapshot } from "../../../../domain/matches/match.schema";
import type { MatchEvent } from "../../../../domain/matches/matchEvent.schema";
import { getActionStatistics } from "../../../../domain/matches/matchStatistics";
import type {
  EventBreakdown,
  StatisticsCategory,
} from "./MatchEventAnalysis.interfaces";

export function useEventBreakdowns(
  filtered: readonly MatchEvent[],
  category: StatisticsCategory,
  periods: MatchSnapshot["match"]["periods"],
  period: number | undefined,
) {
  const t = useTranslations("statistics");
  const recorder = useTranslations("recorder");
  const matches = useTranslations("matches");
  return useMemo<EventBreakdown[]>(() => {
    const statistics = getActionStatistics(filtered);
    const targets: readonly StatisticsCategory[] =
      category === "all" ? ["shot", "ball-recovery", "ball-loss"] : [category];
    return targets.map((chartCategory): EventBreakdown => {
      if (chartCategory === "goalkeeper-save")
        return {
          title: recorder("chooseSave"),
          segments: (["simple", "difficult"] as const).map((difficulty) => ({
            id: difficulty,
            label: recorder(difficulty),
            value: filtered.filter(
              (event) =>
                event.kind === "goalkeeper-save" &&
                event.difficulty === difficulty,
            ).length,
            tone: difficulty === "simple" ? "action" : "blue",
          })),
        };
      if (chartCategory === "timeout")
        return {
          title: t("timeouts"),
          segments: (["own", "opponent"] as const).map((team) => ({
            id: team,
            label: recorder(team),
            value: statistics.timeouts[team],
            tone: team === "own" ? "action" : "muted",
          })),
        };
      if (chartCategory === "card")
        return {
          title: t("cardBreakdown"),
          segments: (["yellow", "blue", "red"] as const).map((colour) => ({
            id: colour,
            label: recorder(colour),
            value: statistics.cards[colour],
            tone: colour,
          })),
        };
      if (chartCategory === "ball-recovery")
        return {
          title: t("recoveries"),
          segments: (
            [
              "interception",
              "duel",
              "loose-ball",
              "intercepted-shot",
              "other",
            ] as const
          ).map((subtype, index) => ({
            id: subtype,
            label: recorder(subtype),
            value: filtered.filter(
              (event) =>
                event.kind === "ball-recovery" && event.subtype === subtype,
            ).length,
            tone:
              index === 0
                ? "action"
                : index === 1
                  ? "blue"
                  : index === 2
                    ? "muted"
                    : index === 3
                      ? "yellow"
                      : "neutral",
          })),
        };
      if (chartCategory === "ball-loss")
        return {
          title: t("losses"),
          segments: (
            ["intercepted-pass", "failed-individual-action", "other"] as const
          ).map((reason, index) => ({
            id: reason,
            label: recorder(reason),
            value: filtered.filter(
              (event) => event.kind === "ball-loss" && event.reason === reason,
            ).length,
            tone: index === 0 ? "red" : index === 1 ? "muted" : "blue",
          })),
        };
      if (chartCategory === "team-foul" || chartCategory === "substitution")
        return {
          title: t(
            chartCategory === "substitution"
              ? "substitutionBreakdown"
              : "foulBreakdown",
          ),
          segments: periods
            .filter((entry) => period === undefined || entry.number === period)
            .map((entry) => ({
              id: String(entry.number),
              label: matches("periodLabel", { number: entry.number }),
              value: filtered.filter((event) => event.period === entry.number)
                .length,
              tone: entry.number === 1 ? "yellow" : "muted",
            })),
        };
      return {
        title: t("shots"),
        segments: [
          {
            id: "goal",
            label: t("goals"),
            value: statistics.goals,
            tone: "action",
          },
          {
            id: "on-target",
            label: t("nonGoalOnTarget"),
            value: statistics.onTarget,
            tone: "blue",
          },
          {
            id: "off-target",
            label: t("offTarget"),
            value: statistics.offTarget,
            tone: "muted",
          },
          {
            id: "blocked",
            label: t("blocked"),
            value: statistics.blocked,
            tone: "yellow",
          },
        ],
      };
    });
  }, [filtered, category, periods, period, t, recorder, matches]);
}
