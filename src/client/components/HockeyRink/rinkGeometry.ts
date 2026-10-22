import type { RinkPoint } from "./HockeyRink.interfaces";

export function isInsideRink(point: RinkPoint): boolean {
  const x = point.x * 1000;
  const y = point.y * 500;
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 0 ||
    x > 1000 ||
    y < 0 ||
    y > 500
  )
    return false;
  const cornerX = Math.max(75, Math.min(925, x));
  const cornerY = Math.max(75, Math.min(425, y));
  return (x - cornerX) ** 2 + (y - cornerY) ** 2 <= 75 ** 2;
}

export function pointerToRink(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): RinkPoint | null {
  const matrix = svg.getScreenCTM();
  if (!matrix || matrix.a * matrix.d - matrix.b * matrix.c === 0) return null;
  const point = new DOMPoint(clientX, clientY).matrixTransform(
    matrix.inverse(),
  );
  const normalized = { x: point.x / 1000, y: point.y / 500 };
  return isInsideRink(normalized) ? normalized : null;
}
