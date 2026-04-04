export const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/x-m4a",
] as const;

export const MAX_AUDIO_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const DEFAULT_SCENE_DURATION_SECONDS = 8;
export const DEFAULT_MOVE_FRACTION = 0.5;
export const MIN_SCENE_DURATION_SECONDS = 1;
export const MAX_SCENE_DURATION_SECONDS = 600;
export const MIN_BOARD_SCALE = 0.35;
export const MAX_BOARD_SCALE = 2.25;
export const SESSION_COOKIE_NAME = "movescript_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
export const SONG_BUCKET_FALLBACK = "songs";
