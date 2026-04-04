"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ProjectCard } from "@/components/dashboard/project-card";
import { Button } from "@/components/ui/button";
import type { ProjectSummary } from "@/lib/types";

export function ProjectList({ projects }: { projects: ProjectSummary[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const filteredProjects = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    if (!normalized) {
      return projects;
    }

    return projects.filter((project) => project.title.toLowerCase().includes(normalized));
  }, [deferredQuery, projects]);

  async function handleDelete(projectId: string) {
    if (!window.confirm("이 프로젝트를 삭제할까요? 곡과 장면도 함께 삭제됩니다.")) {
      return;
    }

    startTransition(async () => {
      await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      router.refresh();
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="프로젝트 검색"
          />
        </div>
        <Button className="gap-2" onClick={() => router.push("/projects/new")}>
          <Plus className="h-4 w-4" />
          새 프로젝트
        </Button>
      </div>

      {filteredProjects.length === 0 ? (
        <EmptyState
          title={query ? "검색 결과가 없습니다." : "아직 프로젝트가 없습니다."}
          description={
            query
              ? "검색어를 바꾸거나 새 프로젝트를 만들어 보세요."
              : "첫 프로젝트를 만들고 곡과 씬을 연결해 안무 편집을 시작하세요."
          }
          action={
            !query ? (
              <Button onClick={() => router.push("/projects/new")}>
                새 프로젝트 만들기
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {isPending ? <p className="text-sm text-slate-500">목록을 갱신하는 중입니다...</p> : null}
    </section>
  );
}
