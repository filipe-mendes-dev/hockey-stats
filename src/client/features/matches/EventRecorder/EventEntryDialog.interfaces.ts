import type { MatchRuleContext } from "../../../../domain/matches/matchRules";
import type {
  EventDraft,
  EventDraftAction,
  EventDraftState,
} from "./eventDraft";
export interface EventEntryDialogProps {
  draft: EventDraft;
  context: MatchRuleContext;
  phase: EventDraftState["phase"];
  error: unknown;
  onAction: (action: EventDraftAction) => void;
  onRetry: () => void;
}
