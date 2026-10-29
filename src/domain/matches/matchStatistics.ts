import type {
  MatchEvent,
  AttemptType,
  MatchEventAnalysisInput,
} from "./matchEvent.schema";
import type { MatchPlayer, MatchSnapshot } from "./match.schema";
import { derivePlayingTime } from "./playingTime";

export interface CardStatistics {
  yellow: number;
  blue: number;
  red: number;
}

export interface ActionStatistics {
  shots: number;
  goals: number;
  onTarget: number;
  offTarget: number;
  blocked: number;
  recoveries: number;
  losses: number;
  fouls: number;
  cards: CardStatistics;
  shotTypes: Record<AttemptType | "unknown", ShotTypeStatistics>;
  saves: number;
  simpleSaves: number;
  difficultSaves: number;
  unclassifiedSaves: number;
  concededGoals: number;
  unattributedConcededGoals: number;
  timeouts: { own: number; opponent: number };
}

export interface ShotTypeStatistics {
  attempts: number;
  goals: number;
}

export interface PlayerMatchStatistics extends ActionStatistics {
  player: MatchPlayer;
  playingTimeMs: number | undefined;
}

export interface PeriodScore {
  period: number;
  own: number;
  opponent: number;
  reliable: boolean;
}

export interface MatchStatistics {
  team: ActionStatistics;
  players: readonly PlayerMatchStatistics[];
  periodScores: readonly PeriodScore[];
}

export function getActionStatistics(
  events: readonly MatchEventAnalysisInput[],
): ActionStatistics {
  const statistics: ActionStatistics = {
    shots: 0,
    goals: 0,
    onTarget: 0,
    offTarget: 0,
    blocked: 0,
    recoveries: 0,
    losses: 0,
    fouls: 0,
    cards: { yellow: 0, blue: 0, red: 0 },
    shotTypes: {
      "open-play": { attempts: 0, goals: 0 },
      penalty: { attempts: 0, goals: 0 },
      "direct-free-hit": { attempts: 0, goals: 0 },
      unknown: { attempts: 0, goals: 0 },
    },
    saves: 0,
    simpleSaves: 0,
    difficultSaves: 0,
    unclassifiedSaves: 0,
    concededGoals: 0,
    unattributedConcededGoals: 0,
    timeouts: { own: 0, opponent: 0 },
  };
  for (const event of events) {
    if (event.deletedAt !== undefined) continue;
    switch (event.kind) {
      case "shot":
        statistics.shots += 1;
        statistics.shotTypes[event.attemptType ?? "unknown"].attempts += 1;
        if (event.outcome === "goal")
          statistics.shotTypes[event.attemptType ?? "unknown"].goals += 1;
        if (event.outcome === "goal") statistics.goals += 1;
        else if (event.outcome === "on-target") statistics.onTarget += 1;
        else if (event.outcome === "off-target") statistics.offTarget += 1;
        else statistics.blocked += 1;
        break;
      case "goalkeeper-save":
        statistics.saves += 1;
        if (event.difficulty === "simple") statistics.simpleSaves += 1;
        else if (event.difficulty === "difficult")
          statistics.difficultSaves += 1;
        else statistics.unclassifiedSaves += 1;
        break;
      case "opponent-goal":
        statistics.concededGoals += 1;
        if (!event.matchPlayerId) statistics.unattributedConcededGoals += 1;
        break;
      case "timeout":
        statistics.timeouts[event.team] += 1;
        break;
      case "ball-recovery":
        statistics.recoveries += 1;
        break;
      case "ball-loss":
        statistics.losses += 1;
        break;
      case "team-foul":
        statistics.fouls += 1;
        break;
      case "card":
        statistics.cards[event.colour] += 1;
        break;
    }
  }
  return statistics;
}

export function getMatchStatistics(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
  period?: number,
): MatchStatistics {
  const selected = events.filter(
    (event) =>
      event.deletedAt === undefined &&
      (period === undefined || event.period === period),
  );
  const playingTimes = derivePlayingTime(snapshot, events).filter(
    (entry) => period === undefined || entry.period === period,
  );
  return {
    team: getActionStatistics(selected),
    players: snapshot.players.map((player) => ({
      ...getActionStatistics(
        selected.filter(
          (event) =>
            "matchPlayerId" in event && event.matchPlayerId === player.id,
        ),
      ),
      player,
      playingTimeMs:
        playingTimes.length > 0 &&
        playingTimes.every((entry) => entry.players !== undefined)
          ? playingTimes.reduce(
              (total, entry) => total + (entry.players?.get(player.id) ?? 0),
              0,
            )
          : undefined,
    })),
    periodScores: snapshot.match.periods.map((entry) => {
      let own = 0;
      let opponent = 0;
      for (const event of events) {
        if (event.deletedAt !== undefined || event.period !== entry.number)
          continue;
        if (event.kind === "shot" && event.outcome === "goal") own += 1;
        else if (event.kind === "opponent-goal") opponent += 1;
        else if (event.kind === "score-adjustment") {
          own += event.ownDelta;
          opponent += event.opponentDelta;
        }
      }
      return {
        period: entry.number,
        own,
        opponent,
        reliable: !events.some(
          (event) =>
            event.deletedAt === undefined && event.kind === "score-adjustment",
        ),
      };
    }),
  };
}
