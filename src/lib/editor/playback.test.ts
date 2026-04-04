import { describe, expect, it } from "vitest";
import { getExitVector, getPlaybackFrame } from "@/lib/editor/playback";
import type { ProjectSnapshot } from "@/lib/types";

const snapshot: ProjectSnapshot = {
  projectId: "project-1",
  title: "Demo",
  ownerId: "user-1",
  updatedAt: new Date().toISOString(),
  editorView: { x: 0, y: 0, scale: 1 },
  song: null,
  share: { enabled: false, token: null, publicUrl: null },
  characterDefs: [],
  scenes: [
    {
      id: "scene-1",
      title: "Scene 1",
      orderIndex: 0,
      startTimeSeconds: 0,
      durationSeconds: 4,
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
          moveDurationSeconds: 2,
          entryType: "carry",
          exitType: "stay",
          exitDirection: "front",
          customExitAngleDegrees: null,
          notes: null,
        },
      ],
    },
    {
      id: "scene-2",
      title: "Scene 2",
      orderIndex: 1,
      startTimeSeconds: 4,
      durationSeconds: 4,
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
          x: 300,
          y: 180,
          isPresent: true,
          moveDurationSeconds: 2,
          entryType: "carry",
          exitType: "stay",
          exitDirection: "front",
          customExitAngleDegrees: null,
          notes: null,
        },
      ],
    },
  ],
};

describe("playback helpers", () => {
  it("returns directional vectors for exits", () => {
    expect(getExitVector("left")).toEqual({ x: -260, y: 0 });
    expect(getExitVector("custom", 90).x).toBeCloseTo(0);
    expect(getExitVector("custom", 90).y).toBeCloseTo(260);
  });

  it("interpolates movement within a scene", () => {
    const frame = getPlaybackFrame(snapshot, 5);
    const person = frame.people[0]!;

    expect(frame.currentSceneId).toBe("scene-2");
    expect(person.x).toBeCloseTo(200);
    expect(person.y).toBeCloseTo(150);
  });
});
