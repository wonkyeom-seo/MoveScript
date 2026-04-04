import { DEFAULT_MOVE_FRACTION } from "@/lib/constants";
import type {
  ExitDirection,
  PlaybackFrame,
  PlaybackPersonFrame,
  ProjectSnapshot,
  ScenePerson,
  SceneSnapshot,
} from "@/lib/types";

const EXIT_DISTANCE = 260;

function interpolate(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

export function getExitVector(direction: ExitDirection, customAngleDegrees?: number | null) {
  switch (direction) {
    case "front":
      return { x: 0, y: EXIT_DISTANCE };
    case "back":
      return { x: 0, y: -EXIT_DISTANCE };
    case "left":
      return { x: -EXIT_DISTANCE, y: 0 };
    case "right":
      return { x: EXIT_DISTANCE, y: 0 };
    case "custom": {
      const angle = ((customAngleDegrees ?? 0) * Math.PI) / 180;
      return {
        x: Math.cos(angle) * EXIT_DISTANCE,
        y: Math.sin(angle) * EXIT_DISTANCE,
      };
    }
  }
}

function indexPeople(scene: SceneSnapshot) {
  return scene.people.reduce<Record<string, ScenePerson>>((acc, person) => {
    acc[person.stableKey] = person;
    return acc;
  }, {});
}

function getPeopleKeys(prevScene: SceneSnapshot | null, currentScene: SceneSnapshot | null) {
  return Array.from(
    new Set([
      ...(prevScene?.people.map((person) => person.stableKey) ?? []),
      ...(currentScene?.people.map((person) => person.stableKey) ?? []),
    ]),
  );
}

export function getPlaybackFrame(snapshot: ProjectSnapshot, currentTime: number): PlaybackFrame {
  const totalDuration = snapshot.scenes.reduce(
    (maxTime, scene) => Math.max(maxTime, scene.startTimeSeconds + scene.durationSeconds),
    0,
  );

  if (snapshot.scenes.length === 0) {
    return {
      currentSceneId: null,
      currentSceneIndex: -1,
      progressWithinScene: 0,
      currentTime,
      totalDuration,
      people: [],
    };
  }

  const sceneIndex = snapshot.scenes.findIndex((scene) => {
    const sceneEnd = scene.startTimeSeconds + scene.durationSeconds;
    return currentTime >= scene.startTimeSeconds && currentTime <= sceneEnd;
  });

  const normalizedSceneIndex = sceneIndex >= 0 ? sceneIndex : snapshot.scenes.length - 1;
  const currentScene = snapshot.scenes[normalizedSceneIndex]!;
  const previousScene = normalizedSceneIndex > 0 ? snapshot.scenes[normalizedSceneIndex - 1]! : null;
  const elapsed = Math.max(0, currentTime - currentScene.startTimeSeconds);
  const progressWithinScene = Math.min(1, elapsed / currentScene.durationSeconds);
  const previousPeople = previousScene ? indexPeople(previousScene) : {};
  const currentPeople = indexPeople(currentScene);

  const people = getPeopleKeys(previousScene, currentScene).map<PlaybackPersonFrame>((stableKey) => {
    const fromPerson = previousPeople[stableKey] ?? null;
    const toPerson = currentPeople[stableKey] ?? null;
    const baseline = toPerson ?? fromPerson;

    if (!baseline) {
      throw new Error("Playback baseline missing");
    }

    const movementDuration =
      toPerson?.moveDurationSeconds ??
      fromPerson?.moveDurationSeconds ??
      currentScene.durationSeconds * DEFAULT_MOVE_FRACTION;
    const movementProgress = Math.min(1, elapsed / Math.max(0.1, movementDuration));
    const fromX = fromPerson?.x ?? toPerson?.x ?? 0;
    const fromY = fromPerson?.y ?? toPerson?.y ?? 0;
    const targetX = toPerson?.x ?? fromX;
    const targetY = toPerson?.y ?? fromY;

    let x = interpolate(fromX, targetX, movementProgress);
    let y = interpolate(fromY, targetY, movementProgress);
    let opacity = toPerson?.isPresent ? 1 : fromPerson?.isPresent ? 1 : 0;

    if (!fromPerson && toPerson) {
      opacity = toPerson.entryType === "appear" ? progressWithinScene : 1;
    }

    if (fromPerson && !toPerson) {
      const exitVector = getExitVector(fromPerson.exitDirection, fromPerson.customExitAngleDegrees);
      x = interpolate(fromPerson.x, fromPerson.x + exitVector.x, movementProgress);
      y = interpolate(fromPerson.y, fromPerson.y + exitVector.y, movementProgress);
      opacity = 1 - progressWithinScene;
    }

    if (fromPerson && toPerson && fromPerson.isPresent && !toPerson.isPresent) {
      const exitVector = getExitVector(toPerson.exitDirection, toPerson.customExitAngleDegrees);
      x = interpolate(fromPerson.x, fromPerson.x + exitVector.x, movementProgress);
      y = interpolate(fromPerson.y, fromPerson.y + exitVector.y, movementProgress);
      opacity = 1 - progressWithinScene;
    }

    if ((!fromPerson || !fromPerson.isPresent) && toPerson?.isPresent && toPerson.entryType === "appear") {
      opacity = progressWithinScene;
    }

    return {
      stableKey,
      label: toPerson?.label ?? fromPerson?.label ?? "",
      shape: toPerson?.shape ?? fromPerson?.shape ?? "circle",
      x,
      y,
      opacity,
      isPresent: opacity > 0.05,
      isMoving: movementProgress < 1,
      entryType: toPerson?.entryType ?? fromPerson?.entryType ?? "carry",
      exitType: toPerson?.exitType ?? fromPerson?.exitType ?? "stay",
    };
  });

  return {
    currentSceneId: currentScene.id,
    currentSceneIndex: normalizedSceneIndex,
    progressWithinScene,
    currentTime,
    totalDuration,
    people,
  };
}
