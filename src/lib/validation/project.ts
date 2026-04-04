import { z } from "zod";
import {
  AUDIO_MIME_TYPES,
  DEFAULT_SCENE_DURATION_SECONDS,
  MAX_AUDIO_FILE_SIZE_BYTES,
  MAX_SCENE_DURATION_SECONDS,
  MIN_SCENE_DURATION_SECONDS,
} from "@/lib/constants";
import { BOARD_MODES, DISPLAY_MODES, ENTRY_TYPES, EXIT_DIRECTIONS, EXIT_TYPES, PERSON_SHAPES } from "@/lib/types";

export const editorViewSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  scale: z.number().positive(),
});

export const importSelectionSchema = z.object({
  projectId: z.string().uuid(),
  sceneIds: z.array(z.string().uuid()).min(1),
});

export const createProjectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  imports: z.array(importSelectionSchema).default([]),
});

export const uploadSongSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.enum(AUDIO_MIME_TYPES),
  fileSize: z.number().int().positive().max(MAX_AUDIO_FILE_SIZE_BYTES),
  durationSeconds: z.number().positive().max(MAX_SCENE_DURATION_SECONDS * 24),
});

export const projectMetaSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  expectedUpdatedAt: z.string().datetime().optional(),
  song: z
    .object({
      storagePath: z.string().min(1),
      originalFilename: z.string().min(1),
      mimeType: z.enum(AUDIO_MIME_TYPES),
      fileSize: z.number().int().positive().max(MAX_AUDIO_FILE_SIZE_BYTES),
      durationSeconds: z.number().positive().max(MAX_SCENE_DURATION_SECONDS * 24),
    })
    .optional(),
});

export const createSceneSchema = z.object({
  mode: z.enum(["blank", "duplicate_previous"]),
  title: z.string().trim().min(1).max(120).optional(),
});

export const scenePersonInputSchema = z.object({
  id: z.string().uuid().nullable(),
  characterDefId: z.string().uuid().nullable(),
  stableKey: z.string().min(1).max(80),
  label: z.string().trim().min(1).max(40),
  displayMode: z.enum(DISPLAY_MODES),
  shape: z.enum(PERSON_SHAPES),
  x: z.number().finite(),
  y: z.number().finite(),
  isPresent: z.boolean(),
  moveDurationSeconds: z.number().positive().max(MAX_SCENE_DURATION_SECONDS).nullable(),
  entryType: z.enum(ENTRY_TYPES),
  exitType: z.enum(EXIT_TYPES),
  exitDirection: z.enum(EXIT_DIRECTIONS),
  customExitAngleDegrees: z.number().min(-180).max(180).nullable(),
  notes: z.string().max(500).nullable(),
});

export const sceneSnapshotSchema = z.object({
  expectedUpdatedAt: z.string().datetime().optional(),
  scene: z.object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(120),
    startTimeSeconds: z.number().min(0),
    durationSeconds: z
      .number()
      .min(MIN_SCENE_DURATION_SECONDS)
      .max(MAX_SCENE_DURATION_SECONDS)
      .default(DEFAULT_SCENE_DURATION_SECONDS),
  }),
  people: z.array(scenePersonInputSchema),
});

export const toggleShareSchema = z.object({
  enabled: z.boolean(),
});

export const boardModeSchema = z.enum(BOARD_MODES);
