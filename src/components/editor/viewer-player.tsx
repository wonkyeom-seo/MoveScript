"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatSeconds } from "@/lib/format";
import { getPlaybackFrame } from "@/lib/editor/playback";
import type { ProjectSnapshot } from "@/lib/types";

export function ViewerPlayer({
  snapshot,
  title,
}: {
  snapshot: ProjectSnapshot;
  title: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (snapshot.song?.signedUrl || !playing) {
      return;
    }

    const start = performance.now();
    const initialTime = currentTime;
    let frame = 0;

    function tick(now: number) {
      setCurrentTime(initialTime + (now - start) / 1000);
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [currentTime, playing, snapshot.song?.signedUrl]);

  const playbackFrame = useMemo(() => getPlaybackFrame(snapshot, currentTime), [currentTime, snapshot]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <Card className="overflow-hidden p-0">
        <div className="board-grid relative min-h-[36rem] bg-white">
          {playbackFrame.people.map((person) => (
            <div
              key={person.stableKey}
              className="absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-800 shadow-lg transition"
              style={{
                left: person.x,
                top: person.y,
                opacity: person.opacity,
              }}
            >
              {person.label}
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent">Viewer</p>
            <h1 className="mt-2 text-2xl font-bold text-ink">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              읽기 전용 재생 화면입니다. 씬 타이밍과 이동 시간에 맞춰 사람 위치를 보간합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={async () => {
                if (snapshot.song?.signedUrl && audioRef.current) {
                  if (playing) {
                    await audioRef.current.pause();
                    setPlaying(false);
                  } else {
                    await audioRef.current.play();
                    setPlaying(true);
                  }
                  return;
                }

                setPlaying((current) => !current);
              }}
            >
              {playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {playing ? "일시정지" : "재생"}
            </Button>
            <span className="text-sm text-slate-500">
              {formatSeconds(currentTime)} / {formatSeconds(playbackFrame.totalDuration)}
            </span>
          </div>

          {snapshot.song?.signedUrl ? (
            <audio
              ref={audioRef}
              className="w-full"
              controls
              src={snapshot.song.signedUrl}
              preload="metadata"
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
          ) : null}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">씬 이동</h2>
          <div className="space-y-2">
            {snapshot.scenes.map((scene) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => {
                  setCurrentTime(scene.startTimeSeconds);
                  if (audioRef.current) {
                    audioRef.current.currentTime = scene.startTimeSeconds;
                  }
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm transition hover:border-accent/20 hover:bg-accent/5"
              >
                <div className="font-semibold text-ink">{scene.title}</div>
                <p className="mt-1 text-xs text-slate-500">
                  {formatSeconds(scene.startTimeSeconds)} · {formatSeconds(scene.durationSeconds)}
                </p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
