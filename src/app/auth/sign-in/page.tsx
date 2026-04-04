import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">
      <div className="grid w-full gap-10 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="flex flex-col justify-center">
          <p className="text-sm uppercase tracking-[0.24em] text-accent">MoveScript</p>
          <h1 className="mt-3 text-4xl font-bold text-ink">계정에 로그인하고 안무를 이어서 편집하세요.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Firebase 세션과 Supabase 데이터 저장소를 연결해 프로젝트, 씬, 보드 상태를 기기 간에
            유지합니다.
          </p>
          <p className="mt-6 text-sm text-slate-500">
            계정이 없나요?{" "}
            <Link className="font-semibold text-accent" href="/auth/sign-up">
              회원가입
            </Link>
          </p>
        </div>
        <div className="flex items-center justify-center">
          <AuthForm mode="sign-in" />
        </div>
      </div>
    </main>
  );
}
