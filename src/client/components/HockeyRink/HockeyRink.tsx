"use client";

import { useId } from "react";
import type { HockeyRinkProps } from "./HockeyRink.interfaces";
import st from "./HockeyRink.module.css";

export function HockeyRink({
  label,
  color = "var(--color-action)",
  backgroundColor = "var(--color-surface)",
  position,
  markers = [],
  viewport,
  svgRef,
}: HockeyRinkProps) {
  const titleId = useId();
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
      <rect width="1000" height="500" rx="75" fill={backgroundColor} />
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
        {[210, 260, 500, 740, 790].map((x) => (
          <circle key={x} cx={x} cy="250" r="2.5" />
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
          transform={`translate(${position.x * 1000} ${position.y * 500})`}
        >
          <circle r="14" />
          <path d="M-24 0H-7M7 0H24M0-24V-7M0 7V24" />
          <circle className={st.point} r="3" />
        </g>
      )}
    </svg>
  );
}
