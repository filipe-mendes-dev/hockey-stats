import type { MatchPlayerIdentityProps } from "./MatchPlayerIdentity.interfaces";
import st from "./MatchPlayerIdentity.module.css";

export function MatchPlayerIdentity({ player }: MatchPlayerIdentityProps) {
  return (
    <span className={st.identity} data-keeper={player.role === "goalkeeper"}>
      <span className={st.number} aria-hidden="true">
        {player.jerseyNumber || "—"}
      </span>
      <strong title={player.playerNameAtMatch}>
        {player.playerNameAtMatch}
      </strong>
    </span>
  );
}
