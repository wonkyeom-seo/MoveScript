import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ViewerPlayer } from "@/components/editor/viewer-player";
import type { ProjectSnapshot } from "@/lib/types";

const snapshot: ProjectSnapshot = {
  projectId: "project-1",
  title: "Demo",
  ownerId: "user-1",
  updatedAt: new Date().toISOString(),
  editorView: { x: 0, y: 0, scale: 1 },
  song: null,
  share: { enabled: true, token: "abc", publicUrl: "https://example.com/share/abc" },
  characterDefs: [],
  scenes: [
    {
      id: "scene-1",
      title: "Scene 1",
      orderIndex: 0,
      startTimeSeconds: 0,
      durationSeconds: 8,
      sourceSceneId: null,
      updatedAt: new Date().toISOString(),
      people: [],
    },
  ],
};

describe("ViewerPlayer", () => {
  it("renders a read-only playback surface without editor controls", () => {
    render(<ViewerPlayer snapshot={snapshot} title="Shared Viewer" />);

    expect(screen.getByText("읽기 전용 재생 화면입니다. 씬 타이밍과 이동 시간에 맞춰 사람 위치를 보간합니다.")).toBeInTheDocument();
    expect(screen.queryByText("선택 삭제")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /재생/i })).toBeInTheDocument();
  });
});
