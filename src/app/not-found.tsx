import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-xl rounded-[2rem] border border-white/60 bg-white/80 p-8 shadow-panel">
        <p className="text-sm uppercase tracking-[0.24em] text-accent">404</p>
        <h1 className="mt-3 text-3xl font-bold text-ink">요청한 프로젝트 또는 공유 링크를 찾을 수 없습니다.</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          링크가 비활성화되었거나, 권한이 없거나, 삭제된 프로젝트일 수 있습니다.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent"
        >
          홈으로 이동
        </Link>
      </div>
    </main>
  );
}
