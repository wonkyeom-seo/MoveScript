import { type NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, requireApiSession } from "@/lib/api";
import { createSongUploadUrl } from "@/lib/supabase/project-repository";
import { uploadSongSchema } from "@/lib/validation/project";

export const runtime = "edge";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const session = await requireApiSession(request);
    const payload = await parseJsonBody(request, uploadSongSchema);
    const { projectId } = await params;
    const upload = await createSongUploadUrl(projectId, session.userId, payload);
    return jsonOk({ upload });
  } catch (error) {
    return jsonError(error);
  }
}
