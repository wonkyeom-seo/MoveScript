"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ImportableProject } from "@/lib/types";
import { getErrorMessage } from "@/lib/errors";

async function readAudioDuration(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const audio = new Audio();
      audio.preload = "metadata";
      audio.src = objectUrl;
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = () => reject(new Error("곡 길이를 읽지 못했습니다."));
    });

    return duration;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function CreateProjectForm({ importableProjects }: { importableProjects: ImportableProject[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [songFile, setSongFile] = useState<File | null>(null);
  const [selectedSceneIds, setSelectedSceneIds] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedImports = useMemo(
    () =>
      Object.entries(selectedSceneIds)
        .filter(([, sceneIds]) => sceneIds.length > 0)
        .map(([projectId, sceneIds]) => ({ projectId, sceneIds })),
    [selectedSceneIds],
  );

  function toggleScene(projectId: string, sceneId: string) {
    setSelectedSceneIds((current) => {
      const currentIds = current[projectId] ?? [];
      const nextIds = currentIds.includes(sceneId)
        ? currentIds.filter((id) => id !== sceneId)
        : [...currentIds, sceneId];

      return {
        ...current,
        [projectId]: nextIds,
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      if (!title.trim()) {
        throw new Error("프로젝트 제목을 입력하세요.");
      }

      if (!songFile) {
        throw new Error("곡 파일을 업로드하세요.");
      }

      const createResponse = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          imports: selectedImports,
        }),
      });

      const created = (await createResponse.json()) as {
        error?: string;
        snapshot?: { projectId: string; updatedAt: string };
      };

      if (!createResponse.ok || !created.snapshot) {
        throw new Error(created.error ?? "프로젝트를 만들지 못했습니다.");
      }

      const durationSeconds = await readAudioDuration(songFile);
      const uploadRequest = await fetch(`/api/projects/${created.snapshot.projectId}/songs/upload-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: songFile.name,
          mimeType: songFile.type,
          fileSize: songFile.size,
          durationSeconds,
        }),
      });

      const uploadPayload = (await uploadRequest.json()) as {
        error?: string;
        upload?: { bucket: string; path: string; token: string };
      };

      if (!uploadRequest.ok || !uploadPayload.upload) {
        throw new Error(uploadPayload.error ?? "곡 업로드 URL을 만들지 못했습니다.");
      }

      const supabase = getBrowserSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase 클라이언트가 설정되지 않았습니다.");
      }

      const { error: uploadError } = await supabase.storage
        .from(uploadPayload.upload.bucket)
        .uploadToSignedUrl(uploadPayload.upload.path, uploadPayload.upload.token, songFile);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const finalizeResponse = await fetch(`/api/projects/${created.snapshot.projectId}/meta`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          song: {
            storagePath: uploadPayload.upload.path,
            originalFilename: songFile.name,
            mimeType: songFile.type,
            fileSize: songFile.size,
            durationSeconds,
          },
        }),
      });

      const finalized = (await finalizeResponse.json()) as { error?: string };

      if (!finalizeResponse.ok) {
        throw new Error(finalized.error ?? "곡 정보를 저장하지 못했습니다.");
      }

      router.push(`/projects/${created.snapshot.projectId}`);
      router.refresh();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-6 xl:grid-cols-[1fr_0.95fr]" onSubmit={handleSubmit}>
      <Card className="space-y-5">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-accent">Create Project</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">새 안무 프로젝트</h1>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="title">
            프로젝트 제목
          </label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: Spring Showcase"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="song-file">
            곡 파일
          </label>
          <label
            htmlFor="song-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-accent/40 hover:bg-accent/5"
          >
            <UploadCloud className="h-6 w-6 text-accent" />
            <div>
              <p className="font-semibold text-slate-700">
                {songFile ? songFile.name : "MP3, WAV, M4A 파일을 선택하세요"}
              </p>
              <p className="mt-1 text-sm text-slate-500">최대 50MB, 프로젝트당 1곡</p>
            </div>
          </label>
          <input
            id="song-file"
            type="file"
            accept="audio/mpeg,audio/wav,audio/mp4,audio/x-m4a"
            className="sr-only"
            onChange={(event) => setSongFile(event.target.files?.[0] ?? null)}
          />
        </div>

        {error ? (
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        ) : null}

        <Button className="w-full" disabled={pending} type="submit">
          {pending ? "프로젝트를 준비하는 중..." : "프로젝트 만들기"}
        </Button>
      </Card>

      <Card className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-ink">기존 씬 가져오기</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            다른 본인 프로젝트에서 원하는 씬을 골라 새 프로젝트 시작점으로 사용할 수 있습니다.
          </p>
        </div>

        {importableProjects.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            가져올 기존 프로젝트가 없습니다.
          </div>
        ) : (
          <div className="max-h-[34rem] space-y-4 overflow-auto pr-1">
            {importableProjects.map((project) => (
              <article key={project.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                <h3 className="font-semibold text-ink">{project.title}</h3>
                <div className="mt-3 space-y-2">
                  {project.scenes.map((scene) => {
                    const checked = selectedSceneIds[project.id]?.includes(scene.id) ?? false;
                    return (
                      <label
                        key={scene.id}
                        className="flex cursor-pointer items-center justify-between rounded-2xl border border-transparent bg-white px-3 py-2 text-sm transition hover:border-accent/20"
                      >
                        <span>
                          {scene.title} · {scene.durationSeconds}초
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleScene(project.id, scene.id)}
                        />
                      </label>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </form>
  );
}
