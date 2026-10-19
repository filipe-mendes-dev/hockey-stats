import type { MatchPlayer } from "../../../../domain/matches/match.schema";
import type { EventDraft, EventDraftAction } from "./eventDraft";
export interface EventDraftFieldsProps {
  draft: EventDraft;
  players: readonly MatchPlayer[];
  activePlayerIds: ReadonlySet<string>;
  ownScore: number;
  opponentScore: number;
  durationMs: number | undefined;
  onAction: (action: EventDraftAction) => void;
}
