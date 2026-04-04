import { Badge } from "@/components/ui/badge";
import type { SaveState } from "@/lib/types";

export function StatusPill({ state, message }: { state: SaveState; message?: string }) {
  if (state === "saving") {
    return <Badge tone="warning">{message ?? "저장 중"}</Badge>;
  }

  if (state === "saved") {
    return <Badge tone="success">{message ?? "저장됨"}</Badge>;
  }

  if (state === "error") {
    return <Badge className="bg-rose-50 text-rose-600">{message ?? "저장 오류"}</Badge>;
  }

  return <Badge>{message ?? "대기 중"}</Badge>;
}
