import { type NextRequest } from "next/server";
import { deleteProject } from "@/lib/supabase/project-repository";
import { jsonError, jsonOk, requireApiSession } from "@/lib/api";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const session = await requireApiSession(request);
    const { projectId } = await params;
    await deleteProject(projectId, session.userId);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
