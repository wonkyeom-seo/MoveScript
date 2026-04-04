import { notFound } from "next/navigation";
import { ProjectEditorShell } from "@/components/editor/project-editor-shell";
import { requireServerSession } from "@/lib/auth/server";
import { AppError } from "@/lib/errors";
import { getProjectSnapshotForOwner, listImportableProjects } from "@/lib/supabase/project-repository";

export const runtime = "edge";

export default async function ProjectEditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await requireServerSession();
  const { projectId } = await params;

  try {
    const [snapshot, importableProjects] = await Promise.all([
      getProjectSnapshotForOwner(projectId, session.userId, true),
      listImportableProjects(session.userId, projectId),
    ]);

    return (
      <ProjectEditorShell
        initialSnapshot={snapshot}
        importableProjects={importableProjects}
        session={session}
      />
    );
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
