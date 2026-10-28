import type { Ref } from "react";

export interface RinkPoint {
  // Normalized display coordinates: left to right and top to bottom.
  x: number;
  y: number;
}

export interface RinkViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RinkMarker {
  id: string;
  position: RinkPoint;
  label: string;
}

export interface RinkOrientation {
  attackingEnd: "left" | "right";
  attackLabel?: string;
  defenceLabel?: string;
}

export interface HockeyRinkProps {
  label: string;
  color?: string;
  backgroundColor?: string;
  position?: RinkPoint | undefined;
  orientation?: RinkOrientation | undefined;
  lineGradient?: "left" | "right";
  selectionSize?: "normal" | "compact";
  markers?: readonly RinkMarker[];
  viewport?: RinkViewport | undefined;
  svgRef?: Ref<SVGSVGElement>;
}
