import type { MatchEvent } from "../../../domain/matches/matchEvent.schema";
import type { StatisticsTone } from "../../components/StatisticsBreakdown/StatisticsBreakdown.interfaces";

export interface EventPresentation {
  tone: StatisticsTone;
}

export function getEventPresentation(event: MatchEvent): EventPresentation {
  const presentation: EventPresentation = {
    tone: "muted",
  };
  switch (event.kind) {
    case "shot":
      return {
        tone:
          event.outcome === "goal"
            ? "action"
            : event.outcome === "on-target"
              ? "blue"
              : event.outcome === "blocked"
                ? "yellow"
                : "muted",
      };
    case "ball-recovery":
      return { tone: "action" };
    case "ball-loss":
      return { tone: "red" };
    case "team-foul":
      return { tone: "yellow" };
    case "card":
      return { tone: event.colour };
    case "goalkeeper-save":
      return {
        ...presentation,
        tone: event.difficulty === "difficult" ? "blue" : "action",
      };
    case "timeout":
      return {
        ...presentation,
        tone: event.team === "own" ? "action" : "muted",
      };
    default:
      return presentation;
  }
}
