"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatSeconds } from "@/lib/format";
import type { SceneSnapshot, SongSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PlaybackTimeline({
  song,
  scenes,
  selectedSceneId,
  onSelectScene,
}: {
  song: SongSummary | null;
  scenes: SceneSnapshot[];
  selectedSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const totalDuration = useMemo(() => {
    const lastScene = scenes[scenes.length - 1];
    return Math.max(song?.durationSeconds ?? 0, lastScene ? lastScene.startTimeSeconds + lastScene.durationSeconds : 0);
  }, [scenes, song?.durationSeconds]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const listener = () => setCurrentTime(audio.currentTime);
    audio.addEventListener("timeupdate", listener);
    return () => audio.removeEventListener("timeupdate", listener);
  }, []);

  return (
    <div className="rounded-[1.75rem] border border-white/60 bg-white/80 p-4 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-accent">Timeline</p>
          <h3 className="mt-1 text-lg font-semibold text-ink">곡 진행과 씬 배치</h3>
        </div>
        {song?.signedUrl ? (
          <audio ref={audioRef} className="w-full max-w-xl" controls src={song.signedUrl} preload="metadata" />
        ) : (
          <p className="text-sm text-slate-500">곡 URL이 없어서 타임라인만 표시합니다.</p>
        )}
      </div>

      <div className="mt-5 overflow-auto">
        <div className="flex min-w-[42rem] items-center gap-2">
          {scenes.map((scene) => {
            const ratio = totalDuration > 0 ? scene.durationSeconds / totalDuration : 0;
            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => {
                  onSelectScene(scene.id);
                  if (audioRef.current) {
                    audioRef.current.currentTime = scene.startTimeSeconds;
                  }
                }}
                className={cn(
                  "rounded-[1.25rem] border px-4 py-3 text-left text-sm transition",
                  selectedSceneId === scene.id
                    ? "border-accent bg-accent/10"
                    : "border-slate-200 bg-slate-50 hover:border-accent/20 hover:bg-accent/5",
                )}
                style={{
                  flexBasis: `${Math.max(12, ratio * 100)}%`,
                }}
              >
                <div className="font-semibold text-ink">{scene.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {formatSeconds(scene.startTimeSeconds)} - {formatSeconds(scene.startTimeSeconds + scene.durationSeconds)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>현재 재생 위치: {formatSeconds(currentTime)}</span>
        <span>총 길이: {formatSeconds(totalDuration)}</span>
      </div>
    </div>
  );
}
