import { Shield } from "lucide-react";
import type { TeamMarkProps } from "./TeamMark.interfaces";
import st from "./TeamMark.module.css";

export function TeamMark({ size = "sm" }: TeamMarkProps) {
  return (
    <span className={st.mark} data-size={size} aria-hidden="true">
      <Shield size={size === "lg" ? 32 : 24} strokeWidth={1.5} />
    </span>
  );
}
