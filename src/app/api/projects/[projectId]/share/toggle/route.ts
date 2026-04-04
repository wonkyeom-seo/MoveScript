import { type NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, requireApiSession } from "@/lib/api";
import { toggleProjectShare } from "@/lib/supabase/project-repository";
import { toggleShareSchema } from "@/lib/validation/project";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const session = await requireApiSession(request);
    const payload = await parseJsonBody(request, toggleShareSchema);
    const { projectId } = await params;
    const snapshot = await toggleProjectShare(projectId, session.userId, payload.enabled);
    return jsonOk({ snapshot });
  } catch (error) {
    return jsonError(error);
  }
}
