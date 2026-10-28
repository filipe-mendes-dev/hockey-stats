import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Crosshair,
  Flag,
  Whistle,
  ShieldCheck,
  RectangleVertical,
  X,
  Target,
  Trophy,
  Timer,
} from "lucide-react";
import type { MatchEventIconProps } from "./MatchEventIcon.interfaces";
import st from "./MatchEventIcon.module.css";

const icons = {
  "ball-recovery": ShieldCheck,
  "ball-loss": X,
  shot: Crosshair,
  "team-foul": Whistle,
  card: RectangleVertical,
  substitution: ArrowLeftRight,
  "player-in": ArrowDownToLine,
  "player-out": ArrowUpFromLine,
  "opponent-goal": Target,
  "score-adjustment": Trophy,
  "powerplay-end": Flag,
  "powerplay-adjust": Flag,
  "suspension-end": Flag,
  "goalkeeper-save": ShieldCheck,
  timeout: Timer,
};

export function MatchEventIcon({ kind, size = 15 }: MatchEventIconProps) {
  const Icon = icons[kind];
  return (
    <Icon
      size={size}
      strokeWidth={kind === "ball-loss" ? 2.5 : 1.7}
      fill={kind === "card" ? "currentColor" : "none"}
      className={
        kind === "ball-recovery"
          ? st.recovery
          : kind === "team-foul"
            ? st.foul
            : undefined
      }
      aria-hidden="true"
    >
      {kind === "team-foul" && <path className={st.cutout} d="M10 6v4" />}
    </Icon>
  );
}
