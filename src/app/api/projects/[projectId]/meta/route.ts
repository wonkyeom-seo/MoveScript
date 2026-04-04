import { type NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, requireApiSession } from "@/lib/api";
import { updateProjectMeta } from "@/lib/supabase/project-repository";
import { projectMetaSchema } from "@/lib/validation/project";

export const runtime = "edge";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const session = await requireApiSession(request);
    const payload = await parseJsonBody(request, projectMetaSchema);
    const { projectId } = await params;
    const snapshot = await updateProjectMeta(projectId, session.userId, payload);
    return jsonOk({ snapshot });
  } catch (error) {
    return jsonError(error);
  }
}
