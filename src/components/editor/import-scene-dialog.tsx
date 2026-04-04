"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ImportableProject } from "@/lib/types";

export function ImportSceneDialog({
  open,
  projects,
  onClose,
  onSubmit,
}: {
  open: boolean;
  projects: ImportableProject[];
  onClose: () => void;
  onSubmit: (imports: { projectId: string; sceneIds: string[] }[]) => Promise<void>;
}) {
  const [selectedSceneIds, setSelectedSceneIds] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);

  const imports = useMemo(
    () =>
      Object.entries(selectedSceneIds)
        .filter(([, sceneIds]) => sceneIds.length > 0)
        .map(([projectId, sceneIds]) => ({ projectId, sceneIds })),
    [selectedSceneIds],
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <Card className="max-h-[80vh] w-full max-w-3xl overflow-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent">Import</p>
            <h3 className="mt-2 text-2xl font-semibold text-ink">다른 프로젝트 씬 가져오기</h3>
          </div>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          {projects.map((project) => (
            <article key={project.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
              <h4 className="font-semibold text-ink">{project.title}</h4>
              <div className="mt-3 space-y-2">
                {project.scenes.map((scene) => {
                  const checked = selectedSceneIds[project.id]?.includes(scene.id) ?? false;
                  return (
                    <label
                      key={scene.id}
                      className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm"
                    >
                      <span>
                        {scene.title} · {scene.durationSeconds}초
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedSceneIds((current) => {
                            const currentIds = current[project.id] ?? [];
                            const nextIds = currentIds.includes(scene.id)
                              ? currentIds.filter((item) => item !== scene.id)
                              : [...currentIds, scene.id];

                            return {
                              ...current,
                              [project.id]: nextIds,
                            };
                          })
                        }
                      />
                    </label>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            disabled={imports.length === 0 || pending}
            onClick={async () => {
              setPending(true);
              await onSubmit(imports);
              setPending(false);
            }}
          >
            {pending ? "가져오는 중..." : "선택한 씬 가져오기"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
