"use client";

import { CopyPlus, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatSecondsLabel } from "@/lib/format";
import type { SceneSnapshot } from "@/lib/types";

export function SceneSidebar({
  scenes,
  selectedSceneId,
  onSelectScene,
  onAddScene,
  onDuplicateScene,
  onImportScene,
}: {
  scenes: SceneSnapshot[];
  selectedSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
  onAddScene: () => void;
  onDuplicateScene: () => void;
  onImportScene: () => void;
}) {
  return (
    <aside className="flex h-full flex-col gap-4 rounded-[1.75rem] border border-white/60 bg-white/80 p-4 shadow-panel">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-accent">Scenes</p>
        <h2 className="mt-2 text-xl font-semibold text-ink">장면 목록</h2>
      </div>

      <div className="grid gap-2">
        <Button variant="secondary" onClick={onAddScene}>
          <Plus className="mr-2 h-4 w-4" />
          빈 씬 추가
        </Button>
        <Button variant="secondary" onClick={onDuplicateScene}>
          <CopyPlus className="mr-2 h-4 w-4" />
          선택 씬 복제
        </Button>
        <Button variant="secondary" onClick={onImportScene}>
          <Download className="mr-2 h-4 w-4" />
          다른 프로젝트 씬 가져오기
        </Button>
      </div>

      <div className="space-y-2 overflow-auto pr-1">
        {scenes.map((scene) => {
          const selected = scene.id === selectedSceneId;
          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => onSelectScene(scene.id)}
              className={cn(
                "w-full rounded-[1.25rem] border px-4 py-3 text-left transition",
                selected
                  ? "border-accent bg-accent/10"
                  : "border-slate-200 bg-slate-50/80 hover:border-accent/20 hover:bg-accent/5",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-ink">{scene.title}</span>
                <span className="text-xs text-slate-500">{scene.people.length}명</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {formatSecondsLabel(scene.startTimeSeconds)} 시작 · {formatSecondsLabel(scene.durationSeconds)}
              </p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
