import { z } from "zod";
import { SONG_BUCKET_FALLBACK } from "@/lib/constants";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
});

const serverEnvSchema = z.object({
  SESSION_SECRET: z.string().min(16).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().optional(),
});

const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

const serverEnv = serverEnvSchema.parse({
  SESSION_SECRET: process.env.SESSION_SECRET,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
});

export function getClientEnv() {
  return clientEnv;
}

export function getServerEnv() {
  return {
    ...serverEnv,
    sessionSecret: serverEnv.SESSION_SECRET ?? "movescript-dev-secret-change-me",
    storageBucket: serverEnv.SUPABASE_STORAGE_BUCKET ?? SONG_BUCKET_FALLBACK,
  };
}

export function isFirebaseConfigured() {
  return Boolean(
    clientEnv.NEXT_PUBLIC_FIREBASE_API_KEY &&
      clientEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      clientEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      clientEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
  );
}

export function isSupabaseConfigured() {
  return Boolean(
    serverEnv.SUPABASE_URL &&
      serverEnv.SUPABASE_SERVICE_ROLE_KEY &&
      clientEnv.NEXT_PUBLIC_SUPABASE_URL &&
      clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function requireSupabaseEnv() {
  const env = getServerEnv();

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

  return env;
}
