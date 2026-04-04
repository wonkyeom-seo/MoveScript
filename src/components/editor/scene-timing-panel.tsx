"use client";

import { Input } from "@/components/ui/input";
import type { SceneSnapshot } from "@/lib/types";

export function SceneTimingPanel({
  scene,
  onChange,
}: {
  scene: SceneSnapshot | null;
  onChange: (patch: Partial<SceneSnapshot>) => void;
}) {
  if (!scene) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-white/60 bg-white/80 p-4 shadow-panel">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-accent">Scene Timing</p>
        <h3 className="mt-1 text-lg font-semibold text-ink">씬 시간 설정</h3>
      </div>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        씬 제목
        <Input value={scene.title} onChange={(event) => onChange({ title: event.target.value })} />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          시작 시간(초)
          <Input
            type="number"
            min={0}
            step="0.1"
            value={scene.startTimeSeconds}
            onChange={(event) => onChange({ startTimeSeconds: Number(event.target.value) })}
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          씬 길이(초)
          <Input
            type="number"
            min={1}
            step="0.1"
            value={scene.durationSeconds}
            onChange={(event) => onChange({ durationSeconds: Number(event.target.value) })}
          />
        </label>
      </div>
    </div>
  );
}
