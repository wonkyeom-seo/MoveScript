"use client";

import { create } from "zustand";
import type {
  BoardMode,
  EditorView,
  ProjectSnapshot,
  SaveState,
  ScenePerson,
  SceneSnapshot,
} from "@/lib/types";

interface ProjectEditorStore {
  snapshot: ProjectSnapshot | null;
  selectedSceneId: string | null;
  selectedPersonStableKey: string | null;
  boardMode: BoardMode;
  dirtySceneIds: string[];
  dirtyView: boolean;
  saveState: SaveState;
  saveMessage: string;
  viewportCenter: { x: number; y: number };
  initialize: (snapshot: ProjectSnapshot) => void;
  applyServerSnapshot: (snapshot: ProjectSnapshot) => void;
  selectScene: (sceneId: string) => void;
  selectPerson: (stableKey: string | null) => void;
  setBoardMode: (mode: BoardMode) => void;
  updateEditorView: (editorView: EditorView) => void;
  updateScene: (sceneId: string, updater: (scene: SceneSnapshot) => SceneSnapshot) => void;
  updatePerson: (sceneId: string, stableKey: string, patch: Partial<ScenePerson>) => void;
  addPeople: (sceneId: string, people: ScenePerson[]) => void;
  deleteSelectedPerson: () => void;
  setViewportCenter: (center: { x: number; y: number }) => void;
  markSaving: (message: string) => void;
  markSaved: (message: string) => void;
  markError: (message: string) => void;
  clearSceneDirty: (sceneId: string) => void;
  clearViewDirty: () => void;
}

function updateSceneArray(
  scenes: SceneSnapshot[],
  sceneId: string,
  updater: (scene: SceneSnapshot) => SceneSnapshot,
) {
  return scenes.map((scene) => (scene.id === sceneId ? updater(scene) : scene));
}

export const useProjectEditorStore = create<ProjectEditorStore>((set) => ({
  snapshot: null,
  selectedSceneId: null,
  selectedPersonStableKey: null,
  boardMode: "select",
  dirtySceneIds: [],
  dirtyView: false,
  saveState: "idle",
  saveMessage: "대기 중",
  viewportCenter: { x: 0, y: 0 },
  initialize: (snapshot) =>
    set((state) => ({
      snapshot,
      selectedSceneId:
        state.selectedSceneId && snapshot.scenes.some((scene) => scene.id === state.selectedSceneId)
          ? state.selectedSceneId
          : snapshot.scenes[0]?.id ?? null,
      selectedPersonStableKey: state.selectedPersonStableKey,
      dirtySceneIds: [],
      dirtyView: false,
      saveState: "idle",
      saveMessage: "대기 중",
    })),
  applyServerSnapshot: (snapshot) =>
    set((state) => {
      const selectedSceneExists =
        state.selectedSceneId && snapshot.scenes.some((scene) => scene.id === state.selectedSceneId);
      const currentScene =
        snapshot.scenes.find((scene) => scene.id === state.selectedSceneId) ?? snapshot.scenes[0] ?? null;
      const selectedPersonExists =
        state.selectedPersonStableKey &&
        currentScene?.people.some((person) => person.stableKey === state.selectedPersonStableKey);

      return {
        snapshot,
        selectedSceneId: selectedSceneExists ? state.selectedSceneId : currentScene?.id ?? null,
        selectedPersonStableKey: selectedPersonExists ? state.selectedPersonStableKey : null,
        dirtySceneIds: [],
        dirtyView: false,
      };
    }),
  selectScene: (sceneId) =>
    set({
      selectedSceneId: sceneId,
      selectedPersonStableKey: null,
    }),
  selectPerson: (stableKey) =>
    set({
      selectedPersonStableKey: stableKey,
    }),
  setBoardMode: (mode) =>
    set({
      boardMode: mode,
    }),
  updateEditorView: (editorView) =>
    set((state) => {
      if (!state.snapshot) {
        return state;
      }

      return {
        snapshot: {
          ...state.snapshot,
          editorView,
        },
        dirtyView: true,
      };
    }),
  updateScene: (sceneId, updater) =>
    set((state) => {
      if (!state.snapshot) {
        return state;
      }

      return {
        snapshot: {
          ...state.snapshot,
          scenes: updateSceneArray(state.snapshot.scenes, sceneId, updater),
        },
        dirtySceneIds: Array.from(new Set([...state.dirtySceneIds, sceneId])),
      };
    }),
  updatePerson: (sceneId, stableKey, patch) =>
    set((state) => {
      if (!state.snapshot) {
        return state;
      }

      return {
        snapshot: {
          ...state.snapshot,
          scenes: updateSceneArray(state.snapshot.scenes, sceneId, (scene) => ({
            ...scene,
            people: scene.people.map((person) =>
              person.stableKey === stableKey
                ? {
                    ...person,
                    ...patch,
                  }
                : person,
            ),
          })),
        },
        dirtySceneIds: Array.from(new Set([...state.dirtySceneIds, sceneId])),
      };
    }),
  addPeople: (sceneId, people) =>
    set((state) => {
      if (!state.snapshot) {
        return state;
      }

      return {
        snapshot: {
          ...state.snapshot,
          scenes: updateSceneArray(state.snapshot.scenes, sceneId, (scene) => ({
            ...scene,
            people: [...scene.people, ...people],
          })),
        },
        dirtySceneIds: Array.from(new Set([...state.dirtySceneIds, sceneId])),
        selectedPersonStableKey: people.at(-1)?.stableKey ?? null,
      };
    }),
  deleteSelectedPerson: () =>
    set((state) => {
      if (!state.snapshot || !state.selectedSceneId || !state.selectedPersonStableKey) {
        return state;
      }

      return {
        snapshot: {
          ...state.snapshot,
          scenes: updateSceneArray(state.snapshot.scenes, state.selectedSceneId, (scene) => ({
            ...scene,
            people: scene.people.filter((person) => person.stableKey !== state.selectedPersonStableKey),
          })),
        },
        dirtySceneIds: Array.from(new Set([...state.dirtySceneIds, state.selectedSceneId])),
        selectedPersonStableKey: null,
      };
    }),
  setViewportCenter: (center) =>
    set({
      viewportCenter: center,
    }),
  markSaving: (message) =>
    set({
      saveState: "saving",
      saveMessage: message,
    }),
  markSaved: (message) =>
    set({
      saveState: "saved",
      saveMessage: message,
    }),
  markError: (message) =>
    set({
      saveState: "error",
      saveMessage: message,
    }),
  clearSceneDirty: (sceneId) =>
    set((state) => ({
      dirtySceneIds: state.dirtySceneIds.filter((id) => id !== sceneId),
    })),
  clearViewDirty: () =>
    set({
      dirtyView: false,
    }),
}));

export function useCurrentScene() {
  return useProjectEditorStore((state) =>
    state.snapshot?.scenes.find((scene) => scene.id === state.selectedSceneId) ?? null,
  );
}

export function useSelectedPerson() {
  return useProjectEditorStore((state) => {
    const scene = state.snapshot?.scenes.find((item) => item.id === state.selectedSceneId);
    return scene?.people.find((person) => person.stableKey === state.selectedPersonStableKey) ?? null;
  });
}
