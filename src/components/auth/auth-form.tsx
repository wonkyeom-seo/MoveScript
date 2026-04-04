"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { AlertTriangle, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getFirebaseAuth, googleProvider } from "@/lib/auth/firebase-client";
import { isFirebaseConfigured } from "@/lib/env";
import { getErrorMessage } from "@/lib/errors";

async function persistSession(idToken: string) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? "세션을 생성하지 못했습니다.");
  }
}

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = searchParams.get("next") || "/dashboard";
  const isSignUp = mode === "sign-up";

  async function handleSuccess(idToken: string) {
    await persistSession(idToken);
    router.replace(nextPath);
    router.refresh();
  }

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error("Firebase 설정이 비어 있습니다.");
      }

      const credential = isSignUp
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);

      const idToken = await credential.user.getIdToken();
      await handleSuccess(idToken);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setPending(false);
    }
  }

  async function handleGoogleLogin() {
    setPending(true);
    setError(null);

    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error("Firebase 설정이 비어 있습니다.");
      }

      const credential = await signInWithPopup(auth, googleProvider);
      const idToken = await credential.user.getIdToken();
      await handleSuccess(idToken);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-xl space-y-6 p-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.24em] text-accent">MoveScript Auth</p>
        <h1 className="text-3xl font-bold text-ink">{isSignUp ? "새 계정 만들기" : "로그인"}</h1>
        <p className="text-sm leading-6 text-slate-600">
          Firebase Authentication으로 Google 또는 이메일 로그인을 처리합니다.
        </p>
      </div>

      {!isFirebaseConfigured() ? (
        <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Firebase 환경 변수가 비어 있습니다. `.env.local`에 설정을 채운 뒤 다시 시도하세요.
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleEmailSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            이메일
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            비밀번호
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8자 이상"
            minLength={8}
            required
          />
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Button className="flex-1" disabled={pending || !isFirebaseConfigured()} type="submit">
            {pending ? "처리 중..." : isSignUp ? "이메일로 가입" : "이메일로 로그인"}
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={pending || !isFirebaseConfigured()}
            type="button"
            variant="secondary"
            onClick={handleGoogleLogin}
          >
            <Chrome className="h-4 w-4" />
            Google로 계속
          </Button>
        </div>
      </form>
    </Card>
  );
}
