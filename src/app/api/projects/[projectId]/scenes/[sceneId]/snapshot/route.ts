import { type NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, requireApiSession } from "@/lib/api";
import { DEFAULT_SCENE_DURATION_SECONDS } from "@/lib/constants";
import { saveSceneSnapshot } from "@/lib/supabase/project-repository";
import { sceneSnapshotSchema } from "@/lib/validation/project";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; sceneId: string }> },
) {
  try {
    const session = await requireApiSession(request);
    const payload = await parseJsonBody(request, sceneSnapshotSchema);
    const { projectId, sceneId } = await params;
    const snapshot = await saveSceneSnapshot(projectId, sceneId, session.userId, {
      ...payload,
      scene: {
        ...payload.scene,
        durationSeconds: payload.scene.durationSeconds ?? DEFAULT_SCENE_DURATION_SECONDS,
      },
    });
    return jsonOk({ snapshot });
  } catch (error) {
    return jsonError(error);
  }
}
