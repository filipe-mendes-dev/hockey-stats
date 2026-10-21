import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  CircleMinus,
  Crosshair,
  Flag,
  Hand,
  ShieldCheck,
  Square,
  Target,
  Trophy,
} from "lucide-react";
import type { RecorderActionIconProps } from "./RecorderBoard.interfaces";
const icons = {
  "ball-recovery": ShieldCheck,
  "ball-loss": CircleMinus,
  shot: Crosshair,
  "team-foul": Hand,
  card: Square,
  substitution: ArrowLeftRight,
  "player-in": ArrowDownToLine,
  "player-out": ArrowUpFromLine,
  "opponent-goal": Target,
  "score-adjustment": Trophy,
  "powerplay-end": Flag,
  "suspension-end": Flag,
};
export function RecorderActionIcon({
  kind,
  size = 20,
}: RecorderActionIconProps) {
  const Icon = icons[kind];
  return <Icon size={size} strokeWidth={1.7} aria-hidden="true" />;
}
