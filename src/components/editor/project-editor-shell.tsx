"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Share2 } from "lucide-react";
import { AddPersonDialog } from "@/components/editor/add-person-dialog";
import { ImportSceneDialog } from "@/components/editor/import-scene-dialog";
import { PersonInspector } from "@/components/editor/person-inspector";
import { PlaybackTimeline } from "@/components/editor/playback-timeline";
import { SceneSidebar } from "@/components/editor/scene-sidebar";
import { SceneTimingPanel } from "@/components/editor/scene-timing-panel";
import { ShareLinkPanel } from "@/components/editor/share-link-panel";
import { WhiteboardCanvas } from "@/components/editor/whiteboard-canvas";
import { WhiteboardToolbar } from "@/components/editor/whiteboard-toolbar";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { useCurrentScene, useProjectEditorStore, useSelectedPerson } from "@/components/editor/use-project-editor-store";
import { clampScale } from "@/lib/editor/geometry";
import { getErrorMessage } from "@/lib/errors";
import type { ImportableProject, ProjectSnapshot, SessionUser } from "@/lib/types";

export function ProjectEditorShell({
  initialSnapshot,
  importableProjects,
  session,
}: {
  initialSnapshot: ProjectSnapshot;
  importableProjects: ImportableProject[];
  session: SessionUser;
}) {
  const router = useRouter();
  const snapshot = useProjectEditorStore((state) => state.snapshot);
  const dirtySceneIds = useProjectEditorStore((state) => state.dirtySceneIds);
  const dirtyView = useProjectEditorStore((state) => state.dirtyView);
  const boardMode = useProjectEditorStore((state) => state.boardMode);
  const saveState = useProjectEditorStore((state) => state.saveState);
  const saveMessage = useProjectEditorStore((state) => state.saveMessage);
  const viewportCenter = useProjectEditorStore((state) => state.viewportCenter);
  const selectedSceneId = useProjectEditorStore((state) => state.selectedSceneId);
  const selectedPersonStableKey = useProjectEditorStore((state) => state.selectedPersonStableKey);
  const initialize = useProjectEditorStore((state) => state.initialize);
  const applyServerSnapshot = useProjectEditorStore((state) => state.applyServerSnapshot);
  const selectScene = useProjectEditorStore((state) => state.selectScene);
  const selectPerson = useProjectEditorStore((state) => state.selectPerson);
  const updateEditorView = useProjectEditorStore((state) => state.updateEditorView);
  const setBoardMode = useProjectEditorStore((state) => state.setBoardMode);
  const updateScene = useProjectEditorStore((state) => state.updateScene);
  const updatePerson = useProjectEditorStore((state) => state.updatePerson);
  const addPeople = useProjectEditorStore((state) => state.addPeople);
  const deleteSelectedPerson = useProjectEditorStore((state) => state.deleteSelectedPerson);
  const setViewportCenter = useProjectEditorStore((state) => state.setViewportCenter);
  const markSaving = useProjectEditorStore((state) => state.markSaving);
  const markSaved = useProjectEditorStore((state) => state.markSaved);
  const markError = useProjectEditorStore((state) => state.markError);
  const clearSceneDirty = useProjectEditorStore((state) => state.clearSceneDirty);
  const clearViewDirty = useProjectEditorStore((state) => state.clearViewDirty);
  const currentScene = useCurrentScene();
  const selectedPerson = useSelectedPerson();

  const [titleDraft, setTitleDraft] = useState(initialSnapshot.title);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    initialize(initialSnapshot);
  }, [initialSnapshot, initialize]);

  const snapshotTitle = snapshot?.title;

  useEffect(() => {
    if (snapshotTitle) {
      setTitleDraft(snapshotTitle);
    }
  }, [snapshotTitle]);

  useEffect(() => {
    if (!snapshot || dirtySceneIds.length === 0) {
      return;
    }

    const sceneId = dirtySceneIds[0];
    const scene = snapshot.scenes.find((item) => item.id === sceneId);
    if (!scene) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      markSaving("씬 저장 중");

      try {
        const response = await fetch(`/api/projects/${snapshot.projectId}/scenes/${scene.id}/snapshot`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expectedUpdatedAt: scene.updatedAt,
            scene: {
              id: scene.id,
              title: scene.title,
              startTimeSeconds: scene.startTimeSeconds,
              durationSeconds: scene.durationSeconds,
            },
            people: scene.people,
          }),
        });

        const payload = (await response.json()) as { error?: string; snapshot?: ProjectSnapshot };
        if (!response.ok || !payload.snapshot) {
          throw new Error(payload.error ?? "씬 저장에 실패했습니다.");
        }

        applyServerSnapshot(payload.snapshot);
        markSaved("씬 저장됨");
      } catch (error) {
        clearSceneDirty(scene.id);
        markError(getErrorMessage(error));
      }
    }, 850);

    return () => window.clearTimeout(timeout);
  }, [applyServerSnapshot, clearSceneDirty, dirtySceneIds, markError, markSaved, markSaving, snapshot]);

  useEffect(() => {
    if (!snapshot || !dirtyView) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        await fetch(`/api/projects/${snapshot.projectId}/editor-view`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(snapshot.editorView),
        });
        clearViewDirty();
      } catch {
        markError("보드 위치 저장에 실패했습니다.");
      }
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [clearViewDirty, dirtyView, markError, snapshot]);

  const nextIndex = useMemo(() => (currentScene?.people.length ?? 0) + 1, [currentScene?.people.length]);

  if (!snapshot) {
    return null;
  }

  const projectId = snapshot.projectId;

  async function refreshWithRequest(request: Promise<Response>, message: string) {
    try {
      markSaving(message);
      const response = await request;
      const payload = (await response.json()) as { error?: string; snapshot?: ProjectSnapshot };
      if (!response.ok || !payload.snapshot) {
        throw new Error(payload.error ?? "요청에 실패했습니다.");
      }

      applyServerSnapshot(payload.snapshot);
      markSaved("저장됨");
    } catch (error) {
      markError(getErrorMessage(error));
    }
  }

  async function saveTitle() {
    if (!snapshot || titleDraft.trim() === snapshot.title.trim()) {
      return;
    }

    await refreshWithRequest(
      fetch(`/api/projects/${projectId}/meta`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: titleDraft,
        }),
      }),
      "프로젝트 제목 저장 중",
    );
  }

  return (
    <>
      <div className="grid min-h-screen gap-5 px-5 py-5 xl:grid-cols-[18rem_1fr_22rem]">
        <SceneSidebar
          scenes={snapshot.scenes}
          selectedSceneId={selectedSceneId}
          onSelectScene={selectScene}
          onAddScene={() =>
            refreshWithRequest(
              fetch(`/api/projects/${projectId}/scenes`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  mode: "blank",
                }),
              }),
              "씬 추가 중",
            )
          }
          onDuplicateScene={() =>
            currentScene
              ? refreshWithRequest(
                  fetch(`/api/projects/${projectId}/scenes/${currentScene.id}/duplicate`, {
                    method: "POST",
                  }),
                  "씬 복제 중",
                )
              : Promise.resolve()
          }
          onImportScene={() => setShowImportDialog(true)}
        />

        <div className="grid min-h-[calc(100vh-2.5rem)] grid-rows-[auto_auto_1fr_auto] gap-5">
          <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/60 bg-white/80 p-5 shadow-panel lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <p className="text-sm uppercase tracking-[0.24em] text-accent">Project Editor</p>
              <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
                <Input
                  className="max-w-xl text-lg font-semibold"
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  onBlur={saveTitle}
                />
                <StatusPill state={saveState} message={saveMessage} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="text-right text-sm text-slate-500">
                <div>{session.email}</div>
                <div>{snapshot.song ? snapshot.song.originalFilename : "곡 미등록"}</div>
              </div>
              <Link
                href={`/projects/${projectId}/viewer`}
                className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-accent/40 hover:text-accent"
              >
                <Eye className="mr-2 h-4 w-4" />
                Owner Viewer
              </Link>
              {snapshot.share.publicUrl ? (
                <Link
                  href={snapshot.share.publicUrl}
                  target="_blank"
                  className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-accent/40 hover:text-accent"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Public Viewer
                </Link>
              ) : null}
              <SignOutButton />
            </div>
          </header>

          <WhiteboardToolbar
            boardMode={boardMode}
            onBoardModeChange={setBoardMode}
            onZoomIn={() => updateEditorView({ ...snapshot.editorView, scale: clampScale(snapshot.editorView.scale * 1.08) })}
            onZoomOut={() => updateEditorView({ ...snapshot.editorView, scale: clampScale(snapshot.editorView.scale * 0.92) })}
            onReset={() => updateEditorView({ x: 360, y: 260, scale: 1 })}
            onAddPerson={() => setShowAddDialog(true)}
            onDeletePerson={deleteSelectedPerson}
          />

          <WhiteboardCanvas
            scene={currentScene}
            view={snapshot.editorView}
            boardMode={boardMode}
            selectedPersonStableKey={selectedPersonStableKey}
            onViewChange={updateEditorView}
            onSelectPerson={selectPerson}
            onMovePerson={(stableKey, coordinates) => currentScene && updatePerson(currentScene.id, stableKey, coordinates)}
            onViewportCenterChange={setViewportCenter}
          />

          <PlaybackTimeline
            song={snapshot.song}
            scenes={snapshot.scenes}
            selectedSceneId={selectedSceneId}
            onSelectScene={selectScene}
          />
        </div>

        <div className="space-y-5">
          <ShareLinkPanel
            share={snapshot.share}
            onToggle={async (enabled) => {
              await refreshWithRequest(
                fetch(`/api/projects/${projectId}/share/toggle`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ enabled }),
                }),
                enabled ? "공유 링크 활성화 중" : "공유 링크 비활성화 중",
              );
            }}
          />

          <SceneTimingPanel
            scene={currentScene}
            onChange={(patch) =>
              currentScene ? updateScene(currentScene.id, (scene) => ({ ...scene, ...patch })) : undefined
            }
          />

          <PersonInspector
            person={selectedPerson}
            onChange={(patch) =>
              selectedPerson && currentScene
                ? updatePerson(currentScene.id, selectedPerson.stableKey, patch)
                : undefined
            }
            onDelete={deleteSelectedPerson}
          />
        </div>
      </div>

      <AddPersonDialog
        open={showAddDialog}
        viewportCenter={viewportCenter}
        nextIndex={nextIndex}
        onClose={() => setShowAddDialog(false)}
        onSubmit={(people) => {
          if (currentScene) {
            addPeople(currentScene.id, people);
          }
        }}
      />

      <ImportSceneDialog
        open={showImportDialog}
        projects={importableProjects}
        onClose={() => setShowImportDialog(false)}
        onSubmit={async (imports) => {
          await refreshWithRequest(
            fetch(`/api/projects/${projectId}/scenes/import`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ imports }),
            }),
            "씬 가져오는 중",
          );
          setShowImportDialog(false);
          router.refresh();
        }}
      />
    </>
  );
}
