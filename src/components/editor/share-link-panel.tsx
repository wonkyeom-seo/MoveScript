"use client";

import { Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShareState } from "@/lib/types";

export function ShareLinkPanel({
  share,
  onToggle,
}: {
  share: ShareState;
  onToggle: (enabled: boolean) => Promise<void>;
}) {
  return (
    <div className="space-y-4 rounded-[1.75rem] border border-white/60 bg-white/80 p-4 shadow-panel">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-accent">Share</p>
        <h3 className="mt-1 text-lg font-semibold text-ink">읽기 전용 공유</h3>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-700">
            {share.enabled ? "공유 링크가 활성화되었습니다." : "공유 링크가 비활성화되어 있습니다."}
          </p>
          <p className="mt-1 text-xs text-slate-500">공개 링크는 보기 전용이며 편집은 허용되지 않습니다.</p>
        </div>
        <Button variant={share.enabled ? "danger" : "primary"} onClick={() => onToggle(!share.enabled)}>
          {share.enabled ? "끄기" : "켜기"}
        </Button>
      </div>

      {share.enabled && share.publicUrl ? (
        <div className="rounded-2xl border border-accent/10 bg-accent/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-accent">
            <Link2 className="h-4 w-4" />
            공유 URL
          </div>
          <p className="mt-2 break-all text-sm text-slate-700">{share.publicUrl}</p>
          <Button
            className="mt-3"
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(share.publicUrl!);
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            링크 복사
          </Button>
        </div>
      ) : null}
    </div>
  );
}
