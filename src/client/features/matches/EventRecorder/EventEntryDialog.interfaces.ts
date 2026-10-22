import type { MatchRuleContext } from "../../../../domain/matches/matchRules";
import type { RecorderRinkSession } from "../RecorderRink/RecorderRink.interfaces";
import type {
  EventDraft,
  EventDraftAction,
  EventDraftState,
} from "./eventDraft";
export interface EventEntryDialogProps {
  draft: EventDraft | null;
  context: MatchRuleContext;
  phase: EventDraftState["phase"];
  error: unknown;
  onAction: (action: EventDraftAction) => void;
  onRetry: () => void;
  rink: RecorderRinkSession;
  liveElapsedMs: number | undefined;
}
