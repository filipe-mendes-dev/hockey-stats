"use client";
import { RecorderActionIcon } from "../RecorderBoard/RecorderActionIcon";
import { RecorderTime } from "./RecorderTime";
import type { RecorderContextProps } from "./RecorderContext.interfaces";
import st from "./RecorderContext.module.css";
export function RecorderContext({
  match,
  period,
  elapsedMs,
  primary,
  secondary,
  kind,
  showTime = true,
}: RecorderContextProps) {
  return (
    <div className={st.context}>
      <div
        className={st.identity}
        title={[primary, secondary].filter(Boolean).join(" · ")}
      >
        {kind && <RecorderActionIcon kind={kind} size={18} />}
        <strong>{primary}</strong>
        {secondary && <span>{secondary}</span>}
      </div>
      {showTime && (
        <RecorderTime match={match} period={period} elapsedMs={elapsedMs} />
      )}
    </div>
  );
}
