"use client";

import { useId } from "react";
import { restartSpots } from "../../../domain/matches/rinkPosition";
import type { HockeyRinkProps } from "./HockeyRink.interfaces";
import st from "./HockeyRink.module.css";

export function HockeyRink({
  label,
  color = "var(--color-action)",
  backgroundColor = "var(--color-surface)",
  position,
  orientation,
  selectionSize = "normal",
  markers = [],
  viewport,
  svgRef,
}: HockeyRinkProps) {
  const titleId = useId();
  const tintId = `${titleId}-tint`;
  const boundaryId = `${titleId}-boundary`;
  return (
    <svg
      ref={svgRef}
      className={st.rink}
      viewBox={
        viewport
          ? `${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`
          : "-8 -8 1016 516"
      }
      color={color}
      role="img"
      aria-labelledby={titleId}
    >
      <title id={titleId}>{label}</title>
      {orientation && (
        <defs>
          <clipPath id={boundaryId}>
            <rect width="1000" height="500" rx="75" />
          </clipPath>
          <linearGradient
            id={tintId}
            x1={orientation.attackingEnd === "left" ? "100%" : "0%"}
            x2={orientation.attackingEnd === "left" ? "0%" : "100%"}
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="42%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="58%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      <rect width="1000" height="500" rx="75" fill={backgroundColor} />
      {orientation && (
        <rect
          width="1000"
          height="500"
          fill={`url(#${tintId})`}
          clipPath={`url(#${boundaryId})`}
        />
      )}
      <g fill="currentColor" opacity="0.045">
        <rect x="75" y="137.5" width="135" height="225" />
        <rect x="790" y="137.5" width="135" height="225" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="2" opacity="0.78">
        <path d="M500 0V500" />
        <circle cx="500" cy="250" r="75" />
        <rect x="75" y="137.5" width="135" height="225" />
        <rect x="790" y="137.5" width="135" height="225" />
        <path d="M75 228.75A21.25 21.25 0 0 1 75 271.25M925 228.75A21.25 21.25 0 0 0 925 271.25" />
      </g>
      <g fill="currentColor">
        {[
          1 - restartSpots.penalty.y,
          1 - restartSpots["direct-free-hit"].y,
          0.5,
          restartSpots["direct-free-hit"].y,
          restartSpots.penalty.y,
        ].map((x) => (
          <circle key={x} cx={x * 1000} cy="250" r="2.5" />
        ))}
      </g>
      <g stroke="currentColor" strokeLinejoin="round">
        <g fill="currentColor" fillOpacity="0.09" strokeWidth="2">
          <path d="M75 228.75H62Q43 250 62 271.25H75Z" />
          <path d="M925 228.75H938Q957 250 938 271.25H925Z" />
        </g>
        <path
          d="M75 228.75V271.25M925 228.75V271.25"
          fill="none"
          strokeWidth="4"
        />
      </g>
      <rect
        width="1000"
        height="500"
        rx="75"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      {orientation && (
        <g className={st.halfLabels}>
          <text
            className={st.attackLabel}
            x={orientation.attackingEnd === "left" ? 250 : 750}
            y="80"
          >
            {orientation.attackLabel}
          </text>
          <text
            className={st.defenceLabel}
            x={orientation.attackingEnd === "left" ? 750 : 250}
            y="80"
          >
            {orientation.defenceLabel}
          </text>
        </g>
      )}
      <g className={st.markers}>
        {markers.map((marker) => (
          <circle
            key={marker.id}
            cx={marker.position.x * 1000}
            cy={marker.position.y * 500}
            r="7"
          >
            <title>{marker.label}</title>
          </circle>
        ))}
      </g>
      {position && (
        <g
          className={st.selection}
          data-size={selectionSize}
          transform={`translate(${position.x * 1000} ${position.y * 500})`}
        >
          {/* Round, non-scaling strokes keep the marker legible in previews. */}
          <path
            className={st.halo}
            d="M0 0h0.001"
            vectorEffect="non-scaling-stroke"
          />
          <path
            className={st.ring}
            d="M0 0h0.001"
            vectorEffect="non-scaling-stroke"
          />
          <path
            className={st.inset}
            d="M0 0h0.001"
            vectorEffect="non-scaling-stroke"
          />
          <path
            className={st.point}
            d="M0 0h0.001"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      )}
    </svg>
  );
}
