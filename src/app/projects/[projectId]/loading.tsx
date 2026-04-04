export default function ProjectLoading() {
  return (
    <div className="grid min-h-screen gap-5 px-5 py-5 xl:grid-cols-[18rem_1fr_22rem]">
      <div className="rounded-[1.75rem] bg-white/70 shadow-panel" />
      <div className="grid gap-5">
        <div className="h-32 rounded-[1.75rem] bg-white/70 shadow-panel" />
        <div className="h-16 rounded-[1.75rem] bg-white/70 shadow-panel" />
        <div className="min-h-[32rem] rounded-[1.75rem] bg-white/70 shadow-panel" />
        <div className="h-40 rounded-[1.75rem] bg-white/70 shadow-panel" />
      </div>
      <div className="rounded-[1.75rem] bg-white/70 shadow-panel" />
    </div>
  );
}
