import { ArrowLeft, ArrowRight, Shield } from "lucide-react";
import type { RinkOrientation } from "./HockeyRink.interfaces";
import st from "./HockeyRinkLabels.module.css";

export function HockeyRinkLabels({
  attackingEnd,
  attackLabel,
  defenceLabel,
}: RinkOrientation) {
  if (!attackLabel || !defenceLabel) return null;
  const AttackIcon = attackingEnd === "left" ? ArrowLeft : ArrowRight;
  return (
    <span className={st.badges}>
      {(["left", "right"] as const).map((side) => {
        const attack = side === attackingEnd;
        return (
          <span
            key={side}
            className={st.badge}
            data-half={attack ? "attack" : "defence"}
          >
            {attack ? (
              <AttackIcon aria-hidden="true" />
            ) : (
              <Shield aria-hidden="true" />
            )}
            <span>{attack ? attackLabel : defenceLabel}</span>
          </span>
        );
      })}
    </span>
  );
}
