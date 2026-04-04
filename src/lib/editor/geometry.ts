import { MAX_BOARD_SCALE, MIN_BOARD_SCALE } from "@/lib/constants";
import type { EditorView } from "@/lib/types";

export function clampScale(scale: number) {
  return Math.min(MAX_BOARD_SCALE, Math.max(MIN_BOARD_SCALE, scale));
}

export function screenToWorld(
  point: { x: number; y: number },
  view: EditorView,
  containerRect: { left: number; top: number },
) {
  return {
    x: (point.x - containerRect.left - view.x) / view.scale,
    y: (point.y - containerRect.top - view.y) / view.scale,
  };
}

export function worldToScreen(
  point: { x: number; y: number },
  view: EditorView,
  containerRect: { left: number; top: number },
) {
  return {
    x: point.x * view.scale + view.x + containerRect.left,
    y: point.y * view.scale + view.y + containerRect.top,
  };
}

export function getViewportCenter(width: number, height: number, view: EditorView) {
  return {
    x: (width / 2 - view.x) / view.scale,
    y: (height / 2 - view.y) / view.scale,
  };
}

export function zoomAroundPoint(
  view: EditorView,
  nextScaleRaw: number,
  pointer: { x: number; y: number },
  containerRect: { left: number; top: number },
) {
  const nextScale = clampScale(nextScaleRaw);
  const worldBefore = screenToWorld(pointer, view, containerRect);

  return {
    scale: nextScale,
    x: pointer.x - containerRect.left - worldBefore.x * nextScale,
    y: pointer.y - containerRect.top - worldBefore.y * nextScale,
  };
}
