"use client";

import { createClient } from "@supabase/supabase-js";
import { getClientEnv } from "@/lib/env";

let client: ReturnType<typeof createClient> | null = null;

export function getBrowserSupabaseClient() {
  if (client) {
    return client;
  }

  const env = getClientEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
  });

  return client;
}
