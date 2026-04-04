export const PERSON_SHAPES = ["circle", "rectangle", "square"] as const;
export const DISPLAY_MODES = ["name", "number"] as const;
export const ENTRY_TYPES = ["carry", "appear"] as const;
export const EXIT_TYPES = ["stay", "exit"] as const;
export const EXIT_DIRECTIONS = ["front", "back", "left", "right", "custom"] as const;
export const BOARD_MODES = ["select", "pan"] as const;
export const SAVE_STATES = ["idle", "saving", "saved", "error"] as const;

export type PersonShape = (typeof PERSON_SHAPES)[number];
export type DisplayMode = (typeof DISPLAY_MODES)[number];
export type EntryType = (typeof ENTRY_TYPES)[number];
export type ExitType = (typeof EXIT_TYPES)[number];
export type ExitDirection = (typeof EXIT_DIRECTIONS)[number];
export type BoardMode = (typeof BOARD_MODES)[number];
export type SaveState = (typeof SAVE_STATES)[number];

export interface SessionUser {
  userId: string;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
}

export interface EditorView {
  x: number;
  y: number;
  scale: number;
}

export interface SongSummary {
  id: string;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  durationSeconds: number;
  signedUrl?: string | null;
}

export interface CharacterDef {
  id: string | null;
  stableKey: string;
  defaultLabel: string;
  defaultDisplayMode: DisplayMode;
  defaultShape: PersonShape;
}

export interface ScenePerson {
  id: string | null;
  characterDefId: string | null;
  stableKey: string;
  label: string;
  displayMode: DisplayMode;
  shape: PersonShape;
  x: number;
  y: number;
  isPresent: boolean;
  moveDurationSeconds: number | null;
  entryType: EntryType;
  exitType: ExitType;
  exitDirection: ExitDirection;
  customExitAngleDegrees: number | null;
  notes: string | null;
}

export interface SceneSnapshot {
  id: string;
  title: string;
  orderIndex: number;
  startTimeSeconds: number;
  durationSeconds: number;
  sourceSceneId: string | null;
  updatedAt: string;
  people: ScenePerson[];
}

export interface ShareState {
  enabled: boolean;
  token: string | null;
  publicUrl: string | null;
}

export interface ProjectSummary {
  id: string;
  title: string;
  updatedAt: string;
  shareEnabled: boolean;
  songFilename: string | null;
  songDurationSeconds: number | null;
  sceneCount: number;
}

export interface ImportableSceneSummary {
  id: string;
  title: string;
  orderIndex: number;
  startTimeSeconds: number;
  durationSeconds: number;
}

export interface ImportableProject {
  id: string;
  title: string;
  updatedAt: string;
  scenes: ImportableSceneSummary[];
}

export interface ProjectSnapshot {
  projectId: string;
  title: string;
  ownerId: string;
  updatedAt: string;
  editorView: EditorView;
  song: SongSummary | null;
  scenes: SceneSnapshot[];
  characterDefs: CharacterDef[];
  share: ShareState;
}

export interface UploadSongInput {
  filename: string;
  mimeType: string;
  fileSize: number;
  durationSeconds: number;
}

export interface PlaybackPersonFrame {
  stableKey: string;
  label: string;
  shape: PersonShape;
  x: number;
  y: number;
  opacity: number;
  isPresent: boolean;
  isMoving: boolean;
  entryType: EntryType;
  exitType: ExitType;
}

export interface PlaybackFrame {
  currentSceneId: string | null;
  currentSceneIndex: number;
  progressWithinScene: number;
  currentTime: number;
  totalDuration: number;
  people: PlaybackPersonFrame[];
}
