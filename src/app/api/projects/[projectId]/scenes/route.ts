import { type NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, requireApiSession } from "@/lib/api";
import { createScene } from "@/lib/supabase/project-repository";
import { createSceneSchema } from "@/lib/validation/project";

export const runtime = "edge";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const session = await requireApiSession(request);
    const payload = await parseJsonBody(request, createSceneSchema);
    const { projectId } = await params;
    const snapshot = await createScene(projectId, session.userId, payload.mode, payload.title);
    return jsonOk({ snapshot }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
