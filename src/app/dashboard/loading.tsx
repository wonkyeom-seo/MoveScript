export default function DashboardLoading() {
  return (
    <div className="mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-10">
      <div className="animate-pulse rounded-[1.75rem] border border-white/60 bg-white/80 p-8 shadow-panel">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="mt-4 h-8 w-48 rounded bg-slate-200" />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="h-48 rounded-[1.5rem] bg-slate-100" />
          <div className="h-48 rounded-[1.5rem] bg-slate-100" />
          <div className="h-48 rounded-[1.5rem] bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
