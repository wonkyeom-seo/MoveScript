import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { requireServerSession } from "@/lib/auth/server";
import { listImportableProjects } from "@/lib/supabase/project-repository";

export const runtime = "edge";

export default async function NewProjectPage() {
  const session = await requireServerSession();
  const importableProjects = await listImportableProjects(session.userId);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-accent"
        >
          <ChevronLeft className="h-4 w-4" />
          대시보드로
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{session.email}</span>
          <SignOutButton />
        </div>
      </header>

      <CreateProjectForm importableProjects={importableProjects} />
    </main>
  );
}
