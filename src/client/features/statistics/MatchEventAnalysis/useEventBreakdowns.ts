import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { MatchStatisticsView } from "../../../../contracts/match-statistics-view.schema";
import type { StatisticsEvent } from "../../../../contracts/match-statistics-view.schema";
import { getActionStatistics } from "../../../../domain/matches/matchStatistics";
import {
  recoveryChoiceOrder,
  lossChoiceOrder,
} from "../../matches/eventChoiceOrder";
import type {
  EventBreakdown,
  StatisticsCategory,
} from "./MatchEventAnalysis.interfaces";

export function useEventBreakdowns(
  filtered: readonly StatisticsEvent[],
  category: StatisticsCategory,
  periods: MatchStatisticsView["match"]["periods"],
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
          segments: recoveryChoiceOrder.map((subtype) => ({
            id: subtype,
            label: recorder(subtype),
            value: filtered.filter(
              (event) =>
                event.kind === "ball-recovery" && event.subtype === subtype,
            ).length,
            tone:
              subtype === "loose-ball" || subtype === "interception"
                ? "action"
                : subtype === "duel"
                  ? "blue"
                  : subtype === "intercepted-shot"
                    ? "yellow"
                    : "neutral",
          })),
        };
      if (chartCategory === "ball-loss")
        return {
          title: t("losses"),
          segments: lossChoiceOrder.map((reason) => ({
            id: reason,
            label: recorder(reason),
            value: filtered.filter(
              (event) => event.kind === "ball-loss" && event.reason === reason,
            ).length,
            tone:
              reason === "intercepted-pass"
                ? "red"
                : reason === "failed-individual-action"
                  ? "blue"
                  : reason === "poor-reception"
                    ? "yellow"
                    : "neutral",
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
