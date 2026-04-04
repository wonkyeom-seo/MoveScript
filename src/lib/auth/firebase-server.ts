import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";
import { AppError } from "@/lib/errors";
import { getClientEnv } from "@/lib/env";

const GOOGLE_JWKS_URL = new URL(
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
);

export interface FirebaseIdentity {
  firebaseUid: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
}

const googleJwks = createRemoteJWKSet(GOOGLE_JWKS_URL);

export function assertFirebaseTokenClaims(payload: JWTPayload, projectId: string) {
  if (!payload.sub) {
    throw new AppError("Firebase 토큰에 uid가 없습니다.", 401);
  }

  if (payload.aud !== projectId) {
    throw new AppError("Firebase 토큰 audience가 올바르지 않습니다.", 401);
  }

  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new AppError("Firebase 토큰 issuer가 올바르지 않습니다.", 401);
  }

  if (!payload.email || typeof payload.email !== "string") {
    throw new AppError("Firebase 토큰에 이메일이 없습니다.", 401);
  }
}

export async function verifyFirebaseIdToken(
  idToken: string,
  options?: { getKey?: JWTVerifyGetKey },
): Promise<FirebaseIdentity> {
  const env = getClientEnv();
  const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new AppError("Firebase 프로젝트 ID가 설정되지 않았습니다.", 500);
  }

  decodeProtectedHeader(idToken);

  const { payload } = await jwtVerify(idToken, options?.getKey ?? googleJwks, {
    algorithms: ["RS256"],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  });

  assertFirebaseTokenClaims(payload, projectId);

  return {
    firebaseUid: payload.sub!,
    email: payload.email as string,
    displayName: typeof payload.name === "string" ? payload.name : null,
    photoUrl: typeof payload.picture === "string" ? payload.picture : null,
  };
}
