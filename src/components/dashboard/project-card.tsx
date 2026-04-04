"use client";

import Link from "next/link";
import { Clock3, Music4, Share2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatSeconds, formatUpdatedAt } from "@/lib/format";
import type { ProjectSummary } from "@/lib/types";

export function ProjectCard({
  project,
  onDelete,
}: {
  project: ProjectSummary;
  onDelete: (projectId: string) => Promise<void>;
}) {
  return (
    <Card className="flex h-full flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-ink">{project.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{project.sceneCount}개 씬</p>
        </div>
        {project.shareEnabled ? <Badge tone="accent">공유 활성화</Badge> : <Badge>비공개</Badge>}
      </div>

      <div className="space-y-3 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Music4 className="h-4 w-4 text-accent" />
          <span>{project.songFilename ? project.songFilename : "곡 미등록"}</span>
          {project.songDurationSeconds ? (
            <span className="text-slate-400">({formatSeconds(project.songDurationSeconds)})</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-slate-400" />
          <span>{formatUpdatedAt(project.updatedAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-slate-400" />
          <span>{project.shareEnabled ? "읽기 전용 링크 사용 중" : "공유 링크 꺼짐"}</span>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-3">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent"
        >
          편집기 열기
        </Link>
        <Link
          href={`/projects/${project.id}/viewer`}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-accent/40 hover:text-accent"
        >
          Viewer
        </Link>
        <Button
          variant="danger"
          className="rounded-full px-3"
          onClick={() => onDelete(project.id)}
          aria-label={`${project.title} 삭제`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
