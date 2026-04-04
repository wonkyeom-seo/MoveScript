"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ScenePerson } from "@/lib/types";
import { toNumberLabel } from "@/lib/format";

function buildBasePerson(
  label: string,
  coordinates: { x: number; y: number },
  shape: ScenePerson["shape"],
  displayMode: ScenePerson["displayMode"],
): ScenePerson {
  return {
    id: null,
    characterDefId: null,
    stableKey: crypto.randomUUID(),
    label,
    displayMode,
    shape,
    x: coordinates.x,
    y: coordinates.y,
    isPresent: true,
    moveDurationSeconds: null,
    entryType: "carry",
    exitType: "stay",
    exitDirection: "front",
    customExitAngleDegrees: null,
    notes: null,
  };
}

export function AddPersonDialog({
  open,
  viewportCenter,
  nextIndex,
  onClose,
  onSubmit,
}: {
  open: boolean;
  viewportCenter: { x: number; y: number };
  nextIndex: number;
  onClose: () => void;
  onSubmit: (people: ScenePerson[]) => void;
}) {
  const [mode, setMode] = useState<"single" | "grid">("single");
  const [label, setLabel] = useState(`P${nextIndex}`);
  const [shape, setShape] = useState<ScenePerson["shape"]>("circle");
  const [displayMode, setDisplayMode] = useState<ScenePerson["displayMode"]>("name");
  const [rows, setRows] = useState(2);
  const [columns, setColumns] = useState(3);
  const [spacing, setSpacing] = useState(120);
  const [namingMode, setNamingMode] = useState<"prefix" | "number">("prefix");

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <Card className="w-full max-w-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent">Add Person</p>
            <h3 className="mt-2 text-2xl font-semibold text-ink">인원 추가</h3>
          </div>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant={mode === "single" ? "primary" : "secondary"} onClick={() => setMode("single")}>
            단일 생성
          </Button>
          <Button variant={mode === "grid" ? "primary" : "secondary"} onClick={() => setMode("grid")}>
            그리드 생성
          </Button>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            기본 라벨
            <Input value={label} onChange={(event) => setLabel(event.target.value)} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              표시 방식
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                value={displayMode}
                onChange={(event) => setDisplayMode(event.target.value as ScenePerson["displayMode"])}
              >
                <option value="name">이름</option>
                <option value="number">번호</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              모양
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                value={shape}
                onChange={(event) => setShape(event.target.value as ScenePerson["shape"])}
              >
                <option value="circle">원형</option>
                <option value="rectangle">직사각형</option>
                <option value="square">정사각형</option>
              </select>
            </label>
          </div>

          {mode === "grid" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  행
                  <Input type="number" min={1} value={rows} onChange={(event) => setRows(Number(event.target.value))} />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  열
                  <Input
                    type="number"
                    min={1}
                    value={columns}
                    onChange={(event) => setColumns(Number(event.target.value))}
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  간격
                  <Input
                    type="number"
                    min={40}
                    value={spacing}
                    onChange={(event) => setSpacing(Number(event.target.value))}
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                라벨 전략
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  value={namingMode}
                  onChange={(event) => setNamingMode(event.target.value as "prefix" | "number")}
                >
                  <option value="prefix">기본 라벨 + 번호</option>
                  <option value="number">순번만 사용</option>
                </select>
              </label>
            </>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={() => {
              if (mode === "single") {
                onSubmit([buildBasePerson(label, viewportCenter, shape, displayMode)]);
                onClose();
                return;
              }

              const people: ScenePerson[] = [];
              const startX = viewportCenter.x - ((columns - 1) * spacing) / 2;
              const startY = viewportCenter.y - ((rows - 1) * spacing) / 2;
              let counter = nextIndex;

              for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
                for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
                  const nextLabel =
                    namingMode === "number" ? toNumberLabel(counter - 1) : `${label}${counter}`;
                  people.push(
                    buildBasePerson(
                      nextLabel,
                      {
                        x: startX + columnIndex * spacing,
                        y: startY + rowIndex * spacing,
                      },
                      shape,
                      displayMode,
                    ),
                  );
                  counter += 1;
                }
              }

              onSubmit(people);
              onClose();
            }}
          >
            추가
          </Button>
        </div>
      </Card>
    </div>
  );
}
