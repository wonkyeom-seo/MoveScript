import { NextResponse, type NextRequest } from "next/server";
import type { ZodSchema } from "zod";
import { getRequestSession } from "@/lib/auth/session";
import { AppError, getErrorMessage } from "@/lib/errors";

export async function parseJsonBody<TValue>(request: NextRequest, schema: ZodSchema<TValue>) {
  const body = await request.json();
  return schema.parse(body);
}

export async function requireApiSession(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) {
    throw new AppError("로그인이 필요합니다.", 401);
  }

  return session;
}

export function jsonOk<TValue>(data: TValue, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: error.status },
    );
  }

  console.error(error);
  return NextResponse.json(
    {
      error: getErrorMessage(error),
    },
    { status: 500 },
  );
}
