import Link from "next/link";
import { Music4, PlayCircle, Users } from "lucide-react";
import { getOptionalServerSession } from "@/lib/auth/server";

const highlights = [
  {
    icon: Users,
    title: "씬 중심 편집",
    description: "장면을 복제하고 사람 이동을 조정하면서 곡 타임라인 위에 안무를 쌓습니다.",
  },
  {
    icon: Music4,
    title: "단일 곡 프로젝트",
    description: "프로젝트마다 곡 하나에 집중해 타이밍과 씬 길이를 안정적으로 맞춥니다.",
  },
  {
    icon: PlayCircle,
    title: "읽기 전용 공유",
    description: "소유자는 공유 링크를 켜고 끌 수 있고, 외부 사용자는 재생만 할 수 있습니다.",
  },
];

export default async function HomePage() {
  const session = await getOptionalServerSession();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-12 px-6 py-10 lg:px-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">MoveScript</p>
          <h1 className="mt-3 text-4xl font-bold text-ink sm:text-5xl">
            안무를 장면 단위로 설계하고
            <br />
            바로 공유하는 편집기
          </h1>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href={session ? "/dashboard" : "/auth/sign-in"}
            className="rounded-full border border-slate-300/80 bg-white/80 px-5 py-2.5 text-sm font-medium text-slate-700 shadow-panel transition hover:border-accent/30 hover:text-accent"
          >
            {session ? "대시보드" : "로그인"}
          </Link>
        </nav>
      </header>

      <section className="grid gap-8 rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-panel backdrop-blur xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <span className="inline-flex rounded-full bg-accent/10 px-4 py-1 text-sm font-medium text-accent">
            프로덕션용 foundation
          </span>
          <p className="max-w-3xl text-lg leading-8 text-slate-700">
            MoveScript는 프로젝트별 곡, 씬, 인물 배치를 분리해 저장하고 DOM 기반 무한 보드에서
            실제 안무 편집 흐름을 처리합니다. 곡 타이밍, 씬 복제, 외부 프로젝트 씬 import, 공유용
            viewer까지 한 앱 안에서 관리합니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={session ? "/projects/new" : "/auth/sign-up"}
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent"
            >
              {session ? "새 프로젝트 만들기" : "회원가입하고 시작"}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-300/80 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent/40 hover:text-accent"
            >
              대시보드 보기
            </Link>
          </div>
        </div>

        <div className="grid gap-4 rounded-[1.5rem] bg-slate-950 p-5 text-white">
          <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Workflow</p>
            <ol className="mt-4 space-y-4 text-sm text-slate-200">
              <li>1. Firebase로 로그인한 뒤 프로젝트를 생성합니다.</li>
              <li>2. 곡 업로드, 씬 복제, 사람 추가, 자동 저장으로 편집합니다.</li>
              <li>3. Owner viewer 또는 공개 share 링크로 재생 결과를 검토합니다.</li>
            </ol>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {highlights.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                <Icon className="h-5 w-5 text-signal" />
                <h2 className="mt-4 text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
