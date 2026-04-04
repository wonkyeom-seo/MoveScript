import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WhiteboardCanvas } from "@/components/editor/whiteboard-canvas";
import type { SceneSnapshot } from "@/lib/types";

const scene: SceneSnapshot = {
  id: "scene-1",
  title: "Scene 1",
  orderIndex: 0,
  startTimeSeconds: 0,
  durationSeconds: 8,
  sourceSceneId: null,
  updatedAt: new Date().toISOString(),
  people: [
    {
      id: null,
      characterDefId: null,
      stableKey: "alpha",
      label: "A",
      displayMode: "name",
      shape: "circle",
      x: 100,
      y: 120,
      isPresent: true,
      moveDurationSeconds: null,
      entryType: "carry",
      exitType: "stay",
      exitDirection: "front",
      customExitAngleDegrees: null,
      notes: null,
    },
  ],
};

describe("WhiteboardCanvas", () => {
  it("only pans when board mode is pan", () => {
    const onViewChange = vi.fn();
    render(
      <WhiteboardCanvas
        scene={scene}
        view={{ x: 0, y: 0, scale: 1 }}
        boardMode="select"
        selectedPersonStableKey={null}
        onViewChange={onViewChange}
        onSelectPerson={vi.fn()}
        onMovePerson={vi.fn()}
        onViewportCenterChange={vi.fn()}
      />,
    );

    const board = screen.getByRole("button", { name: "A" }).closest(".board-grid")!;
    fireEvent.pointerDown(board, { pointerId: 1, clientX: 40, clientY: 40 });
    fireEvent.pointerMove(board, { pointerId: 1, clientX: 100, clientY: 100 });

    expect(onViewChange).not.toHaveBeenCalled();
  });

  it("drags people in select mode", () => {
    const onMovePerson = vi.fn();
    render(
      <WhiteboardCanvas
        scene={scene}
        view={{ x: 0, y: 0, scale: 1 }}
        boardMode="select"
        selectedPersonStableKey={null}
        onViewChange={vi.fn()}
        onSelectPerson={vi.fn()}
        onMovePerson={onMovePerson}
        onViewportCenterChange={vi.fn()}
      />,
    );

    const personButton = screen.getByRole("button", { name: "A" });
    fireEvent.pointerDown(personButton, { clientX: 100, clientY: 120 });
    fireEvent.pointerMove(window, { clientX: 140, clientY: 180 });

    expect(onMovePerson).toHaveBeenCalledWith("alpha", { x: 140, y: 180 });
  });
});
