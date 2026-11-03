import { MatchEventIcon } from "../../../components/MatchEventIcon/MatchEventIcon";
import type { RecorderActionIconProps } from "./RecorderBoard.interfaces";
export function RecorderActionIcon({
  kind,
  size = 20,
}: RecorderActionIconProps) {
  return <MatchEventIcon kind={kind} size={size} />;
}
