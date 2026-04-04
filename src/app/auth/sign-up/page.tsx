import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">
      <div className="grid w-full gap-10 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="flex flex-col justify-center">
          <p className="text-sm uppercase tracking-[0.24em] text-accent">MoveScript</p>
          <h1 className="mt-3 text-4xl font-bold text-ink">새 프로젝트를 만들고 장면을 공유하세요.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            회원가입 후 곡 업로드, scene import, whiteboard 편집, viewer 공유까지 한 흐름으로
            사용할 수 있습니다.
          </p>
          <p className="mt-6 text-sm text-slate-500">
            이미 계정이 있나요?{" "}
            <Link className="font-semibold text-accent" href="/auth/sign-in">
              로그인
            </Link>
          </p>
        </div>
        <div className="flex items-center justify-center">
          <AuthForm mode="sign-up" />
        </div>
      </div>
    </main>
  );
}
