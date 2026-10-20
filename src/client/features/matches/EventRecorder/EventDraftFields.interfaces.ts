import type { MatchRuleContext } from "../../../../domain/matches/matchRules";
import type { EventDraft, EventDraftAction } from "./eventDraft";
export interface EventDraftFieldsProps {
  draft: EventDraft;
  context: MatchRuleContext;
  durationMs: number | undefined;
  onAction: (action: EventDraftAction) => void;
}
