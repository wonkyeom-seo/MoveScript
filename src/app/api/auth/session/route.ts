import { type NextRequest } from "next/server";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session";
import { verifyFirebaseIdToken } from "@/lib/auth/firebase-server";
import { parseJsonBody, jsonError, jsonOk } from "@/lib/api";
import { createSessionSchema } from "@/lib/validation/auth";
import { upsertUserFromFirebaseIdentity } from "@/lib/supabase/project-repository";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await parseJsonBody(request, createSessionSchema);
    const identity = await verifyFirebaseIdToken(idToken);
    const sessionUser = await upsertUserFromFirebaseIdentity(identity);
    await setSessionCookie(sessionUser);

    return jsonOk({ user: sessionUser });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE() {
  try {
    await clearSessionCookie();
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
