import { type NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody, requireApiSession } from "@/lib/api";
import { importScenesIntoProject } from "@/lib/supabase/project-repository";
import { z } from "zod";
import { importSelectionSchema } from "@/lib/validation/project";

export const runtime = "edge";

const schema = z.object({
  imports: z.array(importSelectionSchema).min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const session = await requireApiSession(request);
    const payload = await parseJsonBody(request, schema);
    const { projectId } = await params;
    const snapshot = await importScenesIntoProject(projectId, session.userId, payload.imports);
    return jsonOk({ snapshot }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
