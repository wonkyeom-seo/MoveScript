import { type NextRequest } from "next/server";
import { createProject } from "@/lib/supabase/project-repository";
import { createProjectSchema } from "@/lib/validation/project";
import { jsonError, jsonOk, parseJsonBody, requireApiSession } from "@/lib/api";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    const payload = await parseJsonBody(request, createProjectSchema);
    const snapshot = await createProject(session.userId, payload.title, payload.imports ?? []);
    return jsonOk({ snapshot }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
