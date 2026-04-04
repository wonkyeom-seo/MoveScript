"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getViewportCenter, zoomAroundPoint } from "@/lib/editor/geometry";
import { cn } from "@/lib/utils";
import type { BoardMode, EditorView, SceneSnapshot } from "@/lib/types";
import { PersonNode } from "@/components/editor/person-node";

interface WhiteboardCanvasProps {
  scene: SceneSnapshot | null;
  view: EditorView;
  boardMode: BoardMode;
  selectedPersonStableKey: string | null;
  readonly?: boolean;
  onViewChange: (view: EditorView) => void;
  onSelectPerson: (stableKey: string | null) => void;
  onMovePerson: (stableKey: string, coordinates: { x: number; y: number }) => void;
  onViewportCenterChange: (center: { x: number; y: number }) => void;
}

export function WhiteboardCanvas({
  scene,
  view,
  boardMode,
  selectedPersonStableKey,
  readonly = false,
  onViewChange,
  onSelectPerson,
  onMovePerson,
  onViewportCenterChange,
}: WhiteboardCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [panState, setPanState] = useState<null | {
    pointerId: number;
    startClientX: number;
    startClientY: number;
    initialX: number;
    initialY: number;
  }>(null);
  const [dragState, setDragState] = useState<null | {
    stableKey: string;
    startClientX: number;
    startClientY: number;
    initialX: number;
    initialY: number;
  }>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const rect = node.getBoundingClientRect();
    onViewportCenterChange(getViewportCenter(rect.width, rect.height, view));
  }, [onViewportCenterChange, view]);

  useEffect(() => {
    if (!dragState || readonly) {
      return;
    }

    const activeDrag = dragState;

    function handleMove(event: PointerEvent) {
      onMovePerson(activeDrag.stableKey, {
        x: activeDrag.initialX + (event.clientX - activeDrag.startClientX) / view.scale,
        y: activeDrag.initialY + (event.clientY - activeDrag.startClientY) / view.scale,
      });
    }

    function handleUp() {
      setDragState(null);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragState, onMovePerson, readonly, view.scale]);

  const boardStyle = useMemo<React.CSSProperties>(
    () => ({
      transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
      transformOrigin: "0 0",
      width: 4000,
      height: 2600,
    }),
    [view.scale, view.x, view.y],
  );

  return (
    <div
      ref={containerRef}
      className="board-grid relative h-full min-h-[32rem] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white"
      onClick={() => onSelectPerson(null)}
      onPointerDown={(event) => {
        if (readonly || boardMode !== "pan") {
          return;
        }

        setPanState({
          pointerId: event.pointerId,
          startClientX: event.clientX,
          startClientY: event.clientY,
          initialX: view.x,
          initialY: view.y,
        });
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!panState || readonly || panState.pointerId !== event.pointerId) {
          return;
        }

        onViewChange({
          ...view,
          x: panState.initialX + (event.clientX - panState.startClientX),
          y: panState.initialY + (event.clientY - panState.startClientY),
        });
      }}
      onPointerUp={(event) => {
        if (panState?.pointerId === event.pointerId) {
          setPanState(null);
        }
      }}
      onWheel={(event) => {
        if (readonly) {
          return;
        }

        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const multiplier = event.deltaY < 0 ? 1.08 : 0.92;
        onViewChange(
          zoomAroundPoint(
            view,
            view.scale * multiplier,
            { x: event.clientX, y: event.clientY },
            { left: rect.left, top: rect.top },
          ),
        );
      }}
    >
      <div className="absolute inset-0">
        <div className="relative" style={boardStyle}>
          {scene?.people.map((person) => (
            <button
              key={person.stableKey}
              type="button"
              className={cn("absolute border-0 bg-transparent p-0", readonly ? "cursor-default" : "cursor-move")}
              style={{
                left: person.x,
                top: person.y,
                transform: "translate(-50%, -50%)",
              }}
              onClick={(event) => {
                event.stopPropagation();
                onSelectPerson(person.stableKey);
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
                onSelectPerson(person.stableKey);

                if (readonly || boardMode !== "select") {
                  return;
                }

                setDragState({
                  stableKey: person.stableKey,
                  startClientX: event.clientX,
                  startClientY: event.clientY,
                  initialX: person.x,
                  initialY: person.y,
                });
              }}
            >
              <PersonNode
                person={person}
                selected={selectedPersonStableKey === person.stableKey}
                style={{
                  transform: `scale(${1 / view.scale})`,
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
