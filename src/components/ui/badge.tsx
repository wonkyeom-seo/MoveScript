import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "default" | "accent" | "warning" | "success" }) {
  const toneClass =
    tone === "accent"
      ? "bg-accent/10 text-accent"
      : tone === "warning"
        ? "bg-signal/10 text-signal"
        : tone === "success"
          ? "bg-success/10 text-success"
          : "bg-slate-100 text-slate-700";

  return (
    <span
      className={cn("inline-flex rounded-full px-3 py-1 text-xs font-medium", toneClass, className)}
      {...props}
    />
  );
}
