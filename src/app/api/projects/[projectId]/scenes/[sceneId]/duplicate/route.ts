import { type NextRequest } from "next/server";
import { duplicateScene } from "@/lib/supabase/project-repository";
import { jsonError, jsonOk, requireApiSession } from "@/lib/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; sceneId: string }> },
) {
  try {
    const session = await requireApiSession(request);
    const { projectId, sceneId } = await params;
    const snapshot = await duplicateScene(projectId, sceneId, session.userId);
    return jsonOk({ snapshot }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
