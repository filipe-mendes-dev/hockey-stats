import type { MatchPlayer } from "../../../domain/matches/match.schema";
import type { Player } from "../../../domain/players/player.schema";
import type { TeamPlayer } from "../../../domain/teams/teamPlayer.schema";
import type { MatchCallUpPlayer } from "./MatchCallUpSelection/MatchCallUpSelection.interfaces";

export function getMatchCallUpCandidates(
  memberships: readonly TeamPlayer[],
  players: readonly Player[],
  existing: readonly MatchPlayer[] = [],
): MatchCallUpPlayer[] {
  const candidates = memberships.flatMap<MatchCallUpPlayer>((membership) => {
    const snapshot = existing.find(
      (player) => player.playerId === membership.playerId,
    );
    if (snapshot)
      return [
        {
          playerId: snapshot.playerId,
          name: snapshot.playerNameAtMatch,
          role: snapshot.role,
          jerseyNumber: snapshot.jerseyNumber ?? "",
        },
      ];
    const player = players.find((entry) => entry.id === membership.playerId);
    return player
      ? [
          {
            playerId: player.id,
            name: player.name,
            role: membership.role,
            jerseyNumber: membership.jerseyNumber ?? "",
          },
        ]
      : [];
  });
  for (const player of existing) {
    if (!candidates.some((entry) => entry.playerId === player.playerId))
      candidates.push({
        playerId: player.playerId,
        name: player.playerNameAtMatch,
        role: player.role,
        jerseyNumber: player.jerseyNumber ?? "",
      });
  }
  return candidates;
}
