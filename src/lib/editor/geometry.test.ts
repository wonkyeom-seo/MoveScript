import { describe, expect, it } from "vitest";
import { getViewportCenter, screenToWorld, worldToScreen, zoomAroundPoint } from "@/lib/editor/geometry";

describe("geometry helpers", () => {
  it("converts between world and screen coordinates consistently", () => {
    const view = { x: 120, y: 80, scale: 1.5 };
    const container = { left: 20, top: 40 };
    const point = { x: 320, y: 180 };

    const world = screenToWorld(point, view, container);
    const screen = worldToScreen(world, view, container);

    expect(screen.x).toBeCloseTo(point.x);
    expect(screen.y).toBeCloseTo(point.y);
  });

  it("returns the current viewport center in world space", () => {
    const center = getViewportCenter(800, 600, { x: 200, y: 100, scale: 2 });
    expect(center).toEqual({ x: 100, y: 100 });
  });

  it("zooms around the pointer without drifting the anchor point", () => {
    const next = zoomAroundPoint(
      { x: 120, y: 90, scale: 1 },
      2,
      { x: 400, y: 300 },
      { left: 0, top: 0 },
    );

    expect(next.scale).toBe(2);
    expect(next.x).toBeCloseTo(-160);
    expect(next.y).toBeCloseTo(-120);
  });
});
