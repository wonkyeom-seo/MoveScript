"use client";

import { Hand, MousePointer2, Plus, RefreshCw, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BoardMode } from "@/lib/types";

export function WhiteboardToolbar({
  boardMode,
  onBoardModeChange,
  onZoomIn,
  onZoomOut,
  onReset,
  onAddPerson,
  onDeletePerson,
}: {
  boardMode: BoardMode;
  onBoardModeChange: (mode: BoardMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onAddPerson: () => void;
  onDeletePerson: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant={boardMode === "select" ? "primary" : "secondary"} onClick={() => onBoardModeChange("select")}>
        <MousePointer2 className="mr-2 h-4 w-4" />
        선택
      </Button>
      <Button variant={boardMode === "pan" ? "primary" : "secondary"} onClick={() => onBoardModeChange("pan")}>
        <Hand className="mr-2 h-4 w-4" />
        보드 이동
      </Button>
      <Button variant="secondary" onClick={onAddPerson}>
        <Plus className="mr-2 h-4 w-4" />
        인원 추가
      </Button>
      <Button variant="secondary" onClick={onDeletePerson}>
        <Trash2 className="mr-2 h-4 w-4" />
        선택 삭제
      </Button>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="secondary" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="secondary" onClick={onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="secondary" onClick={onReset}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
