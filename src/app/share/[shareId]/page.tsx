import { notFound } from "next/navigation";
import { ViewerPlayer } from "@/components/editor/viewer-player";
import { AppError } from "@/lib/errors";
import { getProjectSnapshotForShare } from "@/lib/supabase/project-repository";

export default async function ShareViewerPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;

  try {
    const snapshot = await getProjectSnapshotForShare(shareId);

    return (
      <main className="mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-10">
        <ViewerPlayer snapshot={snapshot} title={`${snapshot.title} · Shared Viewer`} />
      </main>
    );
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
