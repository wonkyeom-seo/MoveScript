import { cn } from "@/lib/utils";
import type { ScenePerson } from "@/lib/types";

const shapeClassMap = {
  circle: "h-16 w-16 rounded-full",
  square: "h-16 w-16 rounded-[1.1rem]",
  rectangle: "h-14 w-24 rounded-[1.15rem]",
};

export function PersonNode({
  person,
  selected,
  style,
}: {
  person: ScenePerson;
  selected: boolean;
  style: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "absolute flex items-center justify-center border text-center text-sm font-semibold shadow-lg transition",
        shapeClassMap[person.shape],
        selected
          ? "border-accent bg-accent text-white"
          : person.isPresent
            ? "border-slate-300 bg-white text-slate-800"
            : "border-dashed border-slate-300 bg-white/60 text-slate-400",
      )}
    >
      {person.label}
    </div>
  );
}
