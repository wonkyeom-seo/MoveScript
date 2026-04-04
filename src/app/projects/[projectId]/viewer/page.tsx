import { notFound } from "next/navigation";
import { ViewerPlayer } from "@/components/editor/viewer-player";
import { requireServerSession } from "@/lib/auth/server";
import { AppError } from "@/lib/errors";
import { getProjectSnapshotForOwner } from "@/lib/supabase/project-repository";

export default async function OwnerViewerPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await requireServerSession();
  const { projectId } = await params;

  try {
    const snapshot = await getProjectSnapshotForOwner(projectId, session.userId, true);

    return (
      <main className="mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-10">
        <ViewerPlayer snapshot={snapshot} title={`${snapshot.title} · Owner Viewer`} />
      </main>
    );
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
