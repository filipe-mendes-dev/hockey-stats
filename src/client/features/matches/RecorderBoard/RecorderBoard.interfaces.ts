import type { MatchRuleContext } from "../../../../domain/matches/matchRules";
import type { MatchEventKind } from "../../../../domain/matches/matchEvent.schema";
import type { EventDraft } from "../EventRecorder/eventDraft";
export interface RecorderPlayersProps {
  context: MatchRuleContext;
  disabled: boolean;
  onPick: (
    initial: Pick<EventDraft, "matchPlayerId" | "kind" | "entry">,
  ) => void;
}
export interface RecorderActionsProps extends RecorderPlayersProps {
  undoDisabled: boolean;
  undoPending: boolean;
  onUndo: () => void;
}
export interface RecorderActionIconProps {
  kind: MatchEventKind;
  size?: number;
}
