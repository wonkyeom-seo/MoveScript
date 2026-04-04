import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProjectList } from "@/components/dashboard/project-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireServerSession } from "@/lib/auth/server";
import { listProjectsForOwner } from "@/lib/supabase/project-repository";

export const runtime = "edge";

export default async function DashboardPage() {
  const session = await requireServerSession();
  const projects = await listProjectsForOwner(session.userId);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
      <header className="flex flex-col gap-5 rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-panel backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-sm uppercase tracking-[0.24em] text-accent">Dashboard</p>
            <Badge tone="accent">{session.email}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-ink">내 프로젝트</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            프로젝트를 검색하고, 새 프로젝트를 만들고, 바로 편집기로 이동할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/projects/new">
            <Button>새 프로젝트</Button>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <ProjectList projects={projects} />
    </main>
  );
}
