import "server-only";

import { getClientEnv, getServerEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { DEFAULT_SCENE_DURATION_SECONDS } from "@/lib/constants";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  CharacterDef,
  EditorView,
  ImportableProject,
  ProjectSnapshot,
  ProjectSummary,
  ScenePerson,
  SceneSnapshot,
  SessionUser,
  SongSummary,
  UploadSongInput,
} from "@/lib/types";
import { groupBy, randomToken, safeJsonParse } from "@/lib/utils";

type ProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  editor_view: unknown;
  share_enabled: boolean;
  share_token: string | null;
  updated_at: string;
};

type SongRow = {
  id: string;
  project_id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  duration_seconds: number;
};

type SceneRow = {
  id: string;
  project_id: string;
  title: string;
  order_index: number;
  start_time_seconds: number;
  duration_seconds: number;
  source_scene_id: string | null;
  updated_at: string;
};

type CharacterDefRow = {
  id: string;
  project_id: string;
  stable_key: string;
  default_label: string;
  default_display_mode: ScenePerson["displayMode"];
  default_shape: ScenePerson["shape"];
};

type ScenePersonRow = {
  id: string;
  scene_id: string;
  character_def_id: string;
  x: number;
  y: number;
  is_present: boolean;
  label_override: string | null;
  display_mode: ScenePerson["displayMode"];
  shape: ScenePerson["shape"];
  move_duration_seconds: number | null;
  entry_type: ScenePerson["entryType"] | null;
  exit_type: ScenePerson["exitType"] | null;
  exit_direction: ScenePerson["exitDirection"] | null;
  custom_exit_angle_degrees: number | null;
  notes: string | null;
  character_defs?: CharacterDefRow | CharacterDefRow[] | null;
};

const DEFAULT_EDITOR_VIEW: EditorView = {
  x: 360,
  y: 260,
  scale: 1,
};

function getAppBaseUrl() {
  const env = getClientEnv();
  return env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function normalizeEditorView(editorView: unknown): EditorView {
  const parsed = typeof editorView === "string" ? safeJsonParse(editorView, DEFAULT_EDITOR_VIEW) : editorView;

  if (
    parsed &&
    typeof parsed === "object" &&
    "x" in parsed &&
    "y" in parsed &&
    "scale" in parsed &&
    typeof parsed.x === "number" &&
    typeof parsed.y === "number" &&
    typeof parsed.scale === "number"
  ) {
    return {
      x: parsed.x,
      y: parsed.y,
      scale: parsed.scale,
    };
  }

  return DEFAULT_EDITOR_VIEW;
}

function mapSong(row: SongRow | null, signedUrl?: string | null): SongSummary | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    storagePath: row.storage_path,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    fileSize: Number(row.file_size),
    durationSeconds: Number(row.duration_seconds),
    signedUrl,
  };
}

function mapCharacterDef(row: CharacterDefRow): CharacterDef {
  return {
    id: row.id,
    stableKey: row.stable_key,
    defaultLabel: row.default_label,
    defaultDisplayMode: row.default_display_mode,
    defaultShape: row.default_shape,
  };
}

function mapScenePerson(row: ScenePersonRow): ScenePerson {
  const relation = Array.isArray(row.character_defs) ? row.character_defs[0] : row.character_defs;

  return {
    id: row.id,
    characterDefId: row.character_def_id,
    stableKey: relation?.stable_key ?? row.character_def_id,
    label: row.label_override ?? relation?.default_label ?? "1",
    displayMode: row.display_mode,
    shape: row.shape,
    x: Number(row.x),
    y: Number(row.y),
    isPresent: row.is_present,
    moveDurationSeconds: row.move_duration_seconds ? Number(row.move_duration_seconds) : null,
    entryType: row.entry_type ?? "carry",
    exitType: row.exit_type ?? "stay",
    exitDirection: row.exit_direction ?? "front",
    customExitAngleDegrees: row.custom_exit_angle_degrees ? Number(row.custom_exit_angle_degrees) : null,
    notes: row.notes,
  };
}

async function maybeCreateSongSignedUrl(storagePath: string | null) {
  if (!storagePath) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const { storageBucket } = getServerEnv();
  const { data, error } = await supabase.storage.from(storageBucket).createSignedUrl(storagePath, 60 * 60 * 12);

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data.signedUrl;
}

async function touchProject(projectId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("projects")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) {
    throw new AppError(error.message, 500);
  }
}

async function getOwnedProject(projectId: string, ownerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, owner_id, title, editor_view, share_enabled, share_token, updated_at")
    .eq("id", projectId)
    .eq("owner_id", ownerId)
    .maybeSingle<ProjectRow>();

  if (error) {
    throw new AppError(error.message, 500);
  }

  if (!data) {
    throw new AppError("프로젝트를 찾을 수 없습니다.", 404);
  }

  return data;
}

async function getProjectByShareToken(shareToken: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, owner_id, title, editor_view, share_enabled, share_token, updated_at")
    .eq("share_token", shareToken)
    .eq("share_enabled", true)
    .maybeSingle<ProjectRow>();

  if (error) {
    throw new AppError(error.message, 500);
  }

  if (!data) {
    throw new AppError("공유 링크를 찾을 수 없습니다.", 404);
  }

  return data;
}

async function getSongForProject(projectId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("songs")
    .select("id, project_id, storage_path, original_filename, mime_type, file_size, duration_seconds")
    .eq("project_id", projectId)
    .maybeSingle<SongRow>();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data ?? null;
}

async function getScenesForProject(projectId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("scenes")
    .select("id, project_id, title, order_index, start_time_seconds, duration_seconds, source_scene_id, updated_at")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true })
    .returns<SceneRow[]>();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
}

async function getCharacterDefsForProject(projectId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("character_defs")
    .select("id, project_id, stable_key, default_label, default_display_mode, default_shape")
    .eq("project_id", projectId)
    .returns<CharacterDefRow[]>();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
}

async function getScenePeople(sceneIds: string[]) {
  if (sceneIds.length === 0) {
    return [] as ScenePersonRow[];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("scene_people")
    .select(
      "id, scene_id, character_def_id, x, y, is_present, label_override, display_mode, shape, move_duration_seconds, entry_type, exit_type, exit_direction, custom_exit_angle_degrees, notes, character_defs(id, project_id, stable_key, default_label, default_display_mode, default_shape)",
    )
    .in("scene_id", sceneIds)
    .returns<ScenePersonRow[]>();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
}

async function buildProjectSnapshot(project: ProjectRow, includeSongUrl = false): Promise<ProjectSnapshot> {
  const [song, scenes, characterDefs, people] = await Promise.all([
    getSongForProject(project.id),
    getScenesForProject(project.id),
    getCharacterDefsForProject(project.id),
    getScenePeopleForProject(project.id),
  ]);

  const peopleBySceneId = groupBy(people, (row) => row.scene_id);
  const songUrl = includeSongUrl ? await maybeCreateSongSignedUrl(song?.storage_path ?? null) : null;

  const sceneSnapshots: SceneSnapshot[] = scenes.map((scene) => ({
    id: scene.id,
    title: scene.title,
    orderIndex: scene.order_index,
    startTimeSeconds: Number(scene.start_time_seconds),
    durationSeconds: Number(scene.duration_seconds),
    sourceSceneId: scene.source_scene_id,
    updatedAt: scene.updated_at,
    people: (peopleBySceneId[scene.id] ?? []).map(mapScenePerson),
  }));

  return {
    projectId: project.id,
    title: project.title,
    ownerId: project.owner_id,
    updatedAt: project.updated_at,
    editorView: normalizeEditorView(project.editor_view),
    song: mapSong(song, songUrl),
    scenes: sceneSnapshots,
    characterDefs: characterDefs.map(mapCharacterDef),
    share: {
      enabled: project.share_enabled,
      token: project.share_token,
      publicUrl: project.share_token ? `${getAppBaseUrl()}/share/${project.share_token}` : null,
    },
  };
}

async function getScenePeopleForProject(projectId: string) {
  const scenes = await getScenesForProject(projectId);
  return getScenePeople(scenes.map((scene) => scene.id));
}

async function ensureSceneBelongsToProject(sceneId: string, projectId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("scenes")
    .select("id, project_id, title, order_index, start_time_seconds, duration_seconds, source_scene_id, updated_at")
    .eq("id", sceneId)
    .eq("project_id", projectId)
    .maybeSingle<SceneRow>();

  if (error) {
    throw new AppError(error.message, 500);
  }

  if (!data) {
    throw new AppError("씬을 찾을 수 없습니다.", 404);
  }

  return data;
}

function getNextSceneTiming(existingScenes: SceneRow[]) {
  const lastScene = existingScenes[existingScenes.length - 1];
  const start = lastScene
    ? Number(lastScene.start_time_seconds) + Number(lastScene.duration_seconds)
    : 0;
  const duration = lastScene ? Number(lastScene.duration_seconds) : DEFAULT_SCENE_DURATION_SECONDS;

  return { start, duration };
}

async function insertBlankScene(projectId: string, title?: string) {
  const supabase = getSupabaseAdminClient();
  const scenes = await getScenesForProject(projectId);
  const { start, duration } = getNextSceneTiming(scenes);

  const { error } = await supabase.from("scenes").insert({
    project_id: projectId,
    title: title ?? `Scene ${scenes.length + 1}`,
    order_index: scenes.length,
    start_time_seconds: start,
    duration_seconds: duration,
    source_scene_id: null,
  });

  if (error) {
    throw new AppError(error.message, 500);
  }

  await touchProject(projectId);
}

async function ensureCharacterDef(
  projectId: string,
  stableKey: string,
  defaults: Pick<CharacterDef, "defaultLabel" | "defaultDisplayMode" | "defaultShape">,
) {
  const supabase = getSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("character_defs")
    .select("id, project_id, stable_key, default_label, default_display_mode, default_shape")
    .eq("project_id", projectId)
    .eq("stable_key", stableKey)
    .maybeSingle<CharacterDefRow>();

  if (existingError) {
    throw new AppError(existingError.message, 500);
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("character_defs")
    .insert({
      project_id: projectId,
      stable_key: stableKey,
      default_label: defaults.defaultLabel,
      default_display_mode: defaults.defaultDisplayMode,
      default_shape: defaults.defaultShape,
    })
    .select("id, project_id, stable_key, default_label, default_display_mode, default_shape")
    .single<CharacterDefRow>();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
}

async function cloneSceneIntoProject(
  targetProjectId: string,
  sourceScene: SceneRow,
  sourcePeople: ScenePersonRow[],
  orderIndex: number,
  startTimeSeconds: number,
) {
  const supabase = getSupabaseAdminClient();
  const { data: insertedScene, error: sceneError } = await supabase
    .from("scenes")
    .insert({
      project_id: targetProjectId,
      title: sourceScene.title,
      order_index: orderIndex,
      start_time_seconds: startTimeSeconds,
      duration_seconds: Number(sourceScene.duration_seconds),
      source_scene_id: sourceScene.id,
    })
    .select("id, project_id, title, order_index, start_time_seconds, duration_seconds, source_scene_id, updated_at")
    .single<SceneRow>();

  if (sceneError) {
    throw new AppError(sceneError.message, 500);
  }

  for (const sourcePerson of sourcePeople) {
    const relation = Array.isArray(sourcePerson.character_defs)
      ? sourcePerson.character_defs[0]
      : sourcePerson.character_defs;

    const characterDef = await ensureCharacterDef(targetProjectId, relation?.stable_key ?? sourcePerson.character_def_id, {
      defaultLabel: sourcePerson.label_override ?? relation?.default_label ?? "1",
      defaultDisplayMode: sourcePerson.display_mode,
      defaultShape: sourcePerson.shape,
    });

    const { error } = await supabase.from("scene_people").insert({
      scene_id: insertedScene.id,
      character_def_id: characterDef.id,
      x: sourcePerson.x,
      y: sourcePerson.y,
      is_present: sourcePerson.is_present,
      label_override: sourcePerson.label_override,
      display_mode: sourcePerson.display_mode,
      shape: sourcePerson.shape,
      move_duration_seconds: sourcePerson.move_duration_seconds,
      entry_type: sourcePerson.entry_type ?? "carry",
      exit_type: sourcePerson.exit_type ?? "stay",
      exit_direction: sourcePerson.exit_direction ?? "front",
      custom_exit_angle_degrees: sourcePerson.custom_exit_angle_degrees,
      notes: sourcePerson.notes,
    });

    if (error) {
      throw new AppError(error.message, 500);
    }
  }

  return insertedScene;
}

export async function upsertUserFromFirebaseIdentity(identity: {
  firebaseUid: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
}): Promise<SessionUser> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        firebase_uid: identity.firebaseUid,
        email: identity.email,
        display_name: identity.displayName,
        photo_url: identity.photoUrl,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "firebase_uid",
      },
    )
    .select("id, firebase_uid, email, display_name, photo_url")
    .single<{
      id: string;
      firebase_uid: string;
      email: string;
      display_name: string | null;
      photo_url: string | null;
    }>();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return {
    userId: data.id,
    firebaseUid: data.firebase_uid,
    email: data.email,
    displayName: data.display_name,
    photoUrl: data.photo_url,
  };
}

export async function listProjectsForOwner(ownerId: string): Promise<ProjectSummary[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, updated_at, share_enabled, songs(original_filename, duration_seconds), scenes(id)")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
    shareEnabled: row.share_enabled,
    songFilename: row.songs?.[0]?.original_filename ?? null,
    songDurationSeconds: row.songs?.[0]?.duration_seconds ?? null,
    sceneCount: row.scenes?.length ?? 0,
  }));
}

export async function listImportableProjects(
  ownerId: string,
  excludeProjectId?: string,
): Promise<ImportableProject[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("projects")
    .select("id, title, updated_at, scenes(id, title, order_index, start_time_seconds, duration_seconds)")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (excludeProjectId) {
    query = query.neq("id", excludeProjectId);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(error.message, 500);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
    scenes: (row.scenes ?? [])
      .slice()
      .sort(
        (
          a: { order_index: number; id: string; title: string; start_time_seconds: number; duration_seconds: number },
          b: { order_index: number; id: string; title: string; start_time_seconds: number; duration_seconds: number },
        ) => a.order_index - b.order_index,
      )
      .map((scene: { id: string; title: string; order_index: number; start_time_seconds: number; duration_seconds: number }) => ({
        id: scene.id,
        title: scene.title,
        orderIndex: scene.order_index,
        startTimeSeconds: Number(scene.start_time_seconds),
        durationSeconds: Number(scene.duration_seconds),
      })),
  }));
}

export async function createProject(ownerId: string, title: string, imports: { projectId: string; sceneIds: string[] }[]) {
  const supabase = getSupabaseAdminClient();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      owner_id: ownerId,
      title,
      editor_view: DEFAULT_EDITOR_VIEW,
      share_enabled: false,
      share_token: null,
    })
    .select("id, owner_id, title, editor_view, share_enabled, share_token, updated_at")
    .single<ProjectRow>();

  if (error) {
    throw new AppError(error.message, 500);
  }

  if (imports.length === 0) {
    await insertBlankScene(project.id, "Scene 1");
    return buildProjectSnapshot(await getOwnedProject(project.id, ownerId));
  }

  let orderIndex = 0;
  let startTimeSeconds = 0;

  for (const selection of imports) {
    await getOwnedProject(selection.projectId, ownerId);
    const sourceScenes = (await getScenesForProject(selection.projectId)).filter((scene) =>
      selection.sceneIds.includes(scene.id),
    );
    const sourcePeople = await getScenePeople(sourceScenes.map((scene) => scene.id));
    const peopleBySceneId = groupBy(sourcePeople, (row) => row.scene_id);

    for (const sourceScene of sourceScenes) {
      await cloneSceneIntoProject(
        project.id,
        sourceScene,
        peopleBySceneId[sourceScene.id] ?? [],
        orderIndex,
        startTimeSeconds,
      );
      orderIndex += 1;
      startTimeSeconds += Number(sourceScene.duration_seconds);
    }
  }

  await touchProject(project.id);

  return buildProjectSnapshot(await getOwnedProject(project.id, ownerId));
}

export async function deleteProject(projectId: string, ownerId: string) {
  const project = await getOwnedProject(projectId, ownerId);
  const song = await getSongForProject(project.id);
  const supabase = getSupabaseAdminClient();
  const { storageBucket } = getServerEnv();

  if (song?.storage_path) {
    await supabase.storage.from(storageBucket).remove([song.storage_path]);
  }

  const { error } = await supabase.from("projects").delete().eq("id", project.id);
  if (error) {
    throw new AppError(error.message, 500);
  }
}

export async function createSongUploadUrl(projectId: string, ownerId: string, song: UploadSongInput) {
  await getOwnedProject(projectId, ownerId);
  const supabase = getSupabaseAdminClient();
  const { storageBucket } = getServerEnv();
  const sanitizedFilename = song.filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${ownerId}/${projectId}/${Date.now()}-${sanitizedFilename}`;
  const { data, error } = await supabase.storage.from(storageBucket).createSignedUploadUrl(path);

  if (error) {
    throw new AppError(error.message, 500);
  }

  return {
    bucket: storageBucket,
    path,
    token: data.token,
  };
}

export async function updateProjectMeta(
  projectId: string,
  ownerId: string,
  payload: {
    title?: string;
    expectedUpdatedAt?: string;
    song?: {
      storagePath: string;
      originalFilename: string;
      mimeType: string;
      fileSize: number;
      durationSeconds: number;
    };
  },
) {
  const project = await getOwnedProject(projectId, ownerId);
  if (payload.expectedUpdatedAt && payload.expectedUpdatedAt !== project.updated_at) {
    throw new AppError("다른 기기에서 수정되어 최신 상태가 아닙니다.", 409);
  }

  const supabase = getSupabaseAdminClient();
  let nextSongId: string | null = null;
  const existingSong = await getSongForProject(projectId);

  if (payload.song) {
    if (existingSong?.storage_path && existingSong.storage_path !== payload.song.storagePath) {
      const { storageBucket } = getServerEnv();
      await supabase.storage.from(storageBucket).remove([existingSong.storage_path]);
    }

    const { data: songRow, error: songError } = await supabase
      .from("songs")
      .upsert(
        {
          project_id: projectId,
          storage_path: payload.song.storagePath,
          original_filename: payload.song.originalFilename,
          mime_type: payload.song.mimeType,
          file_size: payload.song.fileSize,
          duration_seconds: payload.song.durationSeconds,
        },
        {
          onConflict: "project_id",
        },
      )
      .select("id")
      .single<{ id: string }>();

    if (songError) {
      throw new AppError(songError.message, 500);
    }

    nextSongId = songRow.id;
  }

  const { error } = await supabase
    .from("projects")
    .update({
      title: payload.title ?? project.title,
      song_id: nextSongId ?? existingSong?.id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) {
    throw new AppError(error.message, 500);
  }

  return buildProjectSnapshot(await getOwnedProject(projectId, ownerId), true);
}

export async function updateProjectEditorView(projectId: string, ownerId: string, editorView: EditorView) {
  await getOwnedProject(projectId, ownerId);
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("projects")
    .update({
      editor_view: editorView,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) {
    throw new AppError(error.message, 500);
  }

  return buildProjectSnapshot(await getOwnedProject(projectId, ownerId), true);
}

export async function getProjectSnapshotForOwner(projectId: string, ownerId: string, includeSongUrl = true) {
  const project = await getOwnedProject(projectId, ownerId);
  return buildProjectSnapshot(project, includeSongUrl);
}

export async function getProjectSnapshotForShare(shareToken: string) {
  const project = await getProjectByShareToken(shareToken);
  return buildProjectSnapshot(project, true);
}

export async function createScene(projectId: string, ownerId: string, mode: "blank" | "duplicate_previous", title?: string) {
  await getOwnedProject(projectId, ownerId);

  if (mode === "blank") {
    await insertBlankScene(projectId, title);
    return buildProjectSnapshot(await getOwnedProject(projectId, ownerId), true);
  }

  const scenes = await getScenesForProject(projectId);
  const lastScene = scenes[scenes.length - 1];
  if (!lastScene) {
    await insertBlankScene(projectId, title);
    return buildProjectSnapshot(await getOwnedProject(projectId, ownerId), true);
  }

  return duplicateScene(projectId, lastScene.id, ownerId, title);
}

export async function duplicateScene(projectId: string, sceneId: string, ownerId: string, title?: string) {
  await getOwnedProject(projectId, ownerId);
  const sourceScene = await ensureSceneBelongsToProject(sceneId, projectId);
  const scenes = await getScenesForProject(projectId);
  const { start } = getNextSceneTiming(scenes);
  const sourcePeople = await getScenePeople([sceneId]);

  await cloneSceneIntoProject(
    projectId,
    { ...sourceScene, title: title ?? `${sourceScene.title} Copy` },
    sourcePeople,
    scenes.length,
    start,
  );
  await touchProject(projectId);

  return buildProjectSnapshot(await getOwnedProject(projectId, ownerId), true);
}

export async function importScenesIntoProject(
  projectId: string,
  ownerId: string,
  imports: { projectId: string; sceneIds: string[] }[],
) {
  await getOwnedProject(projectId, ownerId);

  let existingScenes = await getScenesForProject(projectId);
  let nextOrderIndex = existingScenes.length;
  let nextStart = getNextSceneTiming(existingScenes).start;

  for (const selection of imports) {
    await getOwnedProject(selection.projectId, ownerId);
    const sourceScenes = (await getScenesForProject(selection.projectId)).filter((scene) =>
      selection.sceneIds.includes(scene.id),
    );
    const sourcePeople = await getScenePeople(sourceScenes.map((scene) => scene.id));
    const grouped = groupBy(sourcePeople, (row) => row.scene_id);

    for (const sourceScene of sourceScenes) {
      await cloneSceneIntoProject(projectId, sourceScene, grouped[sourceScene.id] ?? [], nextOrderIndex, nextStart);
      nextOrderIndex += 1;
      nextStart += Number(sourceScene.duration_seconds);
    }

    existingScenes = await getScenesForProject(projectId);
  }

  await touchProject(projectId);

  return buildProjectSnapshot(await getOwnedProject(projectId, ownerId), true);
}

export async function saveSceneSnapshot(
  projectId: string,
  sceneId: string,
  ownerId: string,
  payload: {
    expectedUpdatedAt?: string;
    scene: Pick<SceneSnapshot, "id" | "title" | "startTimeSeconds" | "durationSeconds">;
    people: ScenePerson[];
  },
) {
  await getOwnedProject(projectId, ownerId);
  const currentScene = await ensureSceneBelongsToProject(sceneId, projectId);
  if (payload.expectedUpdatedAt && payload.expectedUpdatedAt !== currentScene.updated_at) {
    throw new AppError("장면이 다른 기기에서 수정되었습니다.", 409);
  }

  const scenes = await getScenesForProject(projectId);
  const currentIndex = scenes.findIndex((scene) => scene.id === sceneId);
  const previousScene = currentIndex > 0 ? scenes[currentIndex - 1] : null;
  const normalizedStart = previousScene
    ? Math.max(payload.scene.startTimeSeconds, Number(previousScene.start_time_seconds) + Number(previousScene.duration_seconds))
    : Math.max(0, payload.scene.startTimeSeconds);

  const supabase = getSupabaseAdminClient();
  const { error: updateSceneError } = await supabase
    .from("scenes")
    .update({
      title: payload.scene.title,
      start_time_seconds: normalizedStart,
      duration_seconds: payload.scene.durationSeconds,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sceneId);

  if (updateSceneError) {
    throw new AppError(updateSceneError.message, 500);
  }

  const remainingScenes = scenes.slice(currentIndex + 1);
  let rollingStart = normalizedStart + payload.scene.durationSeconds;

  for (const scene of remainingScenes) {
    const { error } = await supabase
      .from("scenes")
      .update({
        start_time_seconds: rollingStart,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scene.id);

    if (error) {
      throw new AppError(error.message, 500);
    }

    rollingStart += Number(scene.duration_seconds);
  }

  const keptCharacterDefIds: string[] = [];

  for (const person of payload.people) {
    let characterDef: CharacterDefRow | null = null;

    if (person.characterDefId) {
      const { data, error } = await supabase
        .from("character_defs")
        .select("id, project_id, stable_key, default_label, default_display_mode, default_shape")
        .eq("id", person.characterDefId)
        .maybeSingle<CharacterDefRow>();

      if (error) {
        throw new AppError(error.message, 500);
      }

      characterDef = data;
    }

    const def =
      characterDef ??
      (await ensureCharacterDef(projectId, person.stableKey, {
        defaultLabel: person.label,
        defaultDisplayMode: person.displayMode,
        defaultShape: person.shape,
      }));

    keptCharacterDefIds.push(def.id);

    const { error } = await supabase.from("scene_people").upsert(
      {
        scene_id: sceneId,
        character_def_id: def.id,
        x: person.x,
        y: person.y,
        is_present: person.isPresent,
        label_override: person.label,
        display_mode: person.displayMode,
        shape: person.shape,
        move_duration_seconds: person.moveDurationSeconds,
        entry_type: person.entryType,
        exit_type: person.exitType,
        exit_direction: person.exitDirection,
        custom_exit_angle_degrees: person.customExitAngleDegrees,
        notes: person.notes,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "scene_id,character_def_id",
      },
    );

    if (error) {
      throw new AppError(error.message, 500);
    }
  }

  const scenePeopleRows = await getScenePeople([sceneId]);
  const deleteIds = scenePeopleRows
    .filter((row) => !keptCharacterDefIds.includes(row.character_def_id))
    .map((row) => row.id);

  if (deleteIds.length > 0) {
    const { error } = await supabase.from("scene_people").delete().in("id", deleteIds);
    if (error) {
      throw new AppError(error.message, 500);
    }
  }

  await touchProject(projectId);

  return buildProjectSnapshot(await getOwnedProject(projectId, ownerId), true);
}

export async function toggleProjectShare(projectId: string, ownerId: string, enabled: boolean) {
  const project = await getOwnedProject(projectId, ownerId);
  const supabase = getSupabaseAdminClient();
  const token = project.share_token ?? randomToken(20);
  const { error } = await supabase
    .from("projects")
    .update({
      share_enabled: enabled,
      share_token: token,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) {
    throw new AppError(error.message, 500);
  }

  return buildProjectSnapshot(await getOwnedProject(projectId, ownerId), true);
}
