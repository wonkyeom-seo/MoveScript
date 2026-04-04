"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ScenePerson } from "@/lib/types";

export function PersonInspector({
  person,
  onChange,
  onDelete,
}: {
  person: ScenePerson | null;
  onChange: (patch: Partial<ScenePerson>) => void;
  onDelete: () => void;
}) {
  if (!person) {
    return (
      <EmptyState
        className="min-h-[20rem]"
        title="선택된 인원이 없습니다."
        description="보드에서 사람을 클릭하면 이름, 표시 모드, 등장/퇴장, 이동 시간을 수정할 수 있습니다."
      />
    );
  }

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-white/60 bg-white/80 p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-accent">Person</p>
          <h3 className="mt-1 text-lg font-semibold text-ink">{person.label}</h3>
        </div>
        <Button variant="danger" onClick={onDelete}>
          삭제
        </Button>
      </div>

      <div className="grid gap-3">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          표시 텍스트
          <Input value={person.label} onChange={(event) => onChange({ label: event.target.value })} />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          표시 방식
          <select
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            value={person.displayMode}
            onChange={(event) => onChange({ displayMode: event.target.value as ScenePerson["displayMode"] })}
          >
            <option value="name">이름</option>
            <option value="number">번호</option>
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          모양
          <select
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            value={person.shape}
            onChange={(event) => onChange({ shape: event.target.value as ScenePerson["shape"] })}
          >
            <option value="circle">원형</option>
            <option value="rectangle">직사각형</option>
            <option value="square">정사각형</option>
          </select>
        </label>
        <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          현재 씬에 존재
          <input
            type="checkbox"
            checked={person.isPresent}
            onChange={(event) => onChange({ isPresent: event.target.checked })}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            등장 방식
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              value={person.entryType}
              onChange={(event) => onChange({ entryType: event.target.value as ScenePerson["entryType"] })}
            >
              <option value="carry">이전 상태 유지</option>
              <option value="appear">등장</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            퇴장 방식
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              value={person.exitType}
              onChange={(event) => onChange({ exitType: event.target.value as ScenePerson["exitType"] })}
            >
              <option value="stay">유지</option>
              <option value="exit">퇴장</option>
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            퇴장 방향
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              value={person.exitDirection}
              onChange={(event) => onChange({ exitDirection: event.target.value as ScenePerson["exitDirection"] })}
            >
              <option value="front">앞</option>
              <option value="back">뒤</option>
              <option value="left">왼쪽</option>
              <option value="right">오른쪽</option>
              <option value="custom">커스텀</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            이동 시간(초)
            <Input
              type="number"
              min={0}
              step="0.1"
              value={person.moveDurationSeconds ?? ""}
              onChange={(event) =>
                onChange({
                  moveDurationSeconds: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </label>
        </div>
        {person.exitDirection === "custom" ? (
          <label className="space-y-2 text-sm font-medium text-slate-700">
            커스텀 각도
            <Input
              type="number"
              min={-180}
              max={180}
              step="1"
              value={person.customExitAngleDegrees ?? 0}
              onChange={(event) =>
                onChange({
                  customExitAngleDegrees: Number(event.target.value),
                })
              }
            />
          </label>
        ) : null}
        <label className="space-y-2 text-sm font-medium text-slate-700">
          메모
          <Textarea
            rows={4}
            value={person.notes ?? ""}
            onChange={(event) => onChange({ notes: event.target.value || null })}
            placeholder="예: 센터 마크, 소품 여부"
          />
        </label>
      </div>
    </div>
  );
}
