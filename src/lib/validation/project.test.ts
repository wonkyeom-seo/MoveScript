import { describe, expect, it } from "vitest";
import { createProjectSchema, sceneSnapshotSchema, uploadSongSchema } from "@/lib/validation/project";

describe("project validation", () => {
  it("accepts project creation payloads with imports", () => {
    const parsed = createProjectSchema.parse({
      title: "Spring Show",
      imports: [{ projectId: "f0d66461-d272-42b3-81ca-1ab6e86fbcca", sceneIds: ["93cbce9a-b418-4b59-bf53-2f7c9fc4b494"] }],
    });

    expect(parsed.title).toBe("Spring Show");
    expect(parsed.imports).toHaveLength(1);
  });

  it("rejects unsupported audio mime types", () => {
    expect(() =>
      uploadSongSchema.parse({
        filename: "demo.ogg",
        mimeType: "audio/ogg",
        fileSize: 1200,
        durationSeconds: 40,
      }),
    ).toThrow();
  });

  it("fills defaults in scene snapshots", () => {
    const parsed = sceneSnapshotSchema.parse({
      scene: {
        id: "93cbce9a-b418-4b59-bf53-2f7c9fc4b494",
        title: "Scene 1",
        startTimeSeconds: 0,
      },
      people: [],
    });

    expect(parsed.scene.durationSeconds).toBeDefined();
  });
});
