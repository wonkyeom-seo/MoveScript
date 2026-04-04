import "dotenv/config";

import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경 변수가 비어 있습니다.`);
  }
  return value;
}

function createToneWavBuffer(durationSeconds = 2, frequency = 440) {
  const sampleRate = 44_100;
  const sampleCount = sampleRate * durationSeconds;
  const samples = new Int16Array(sampleCount);

  for (let index = 0; index < sampleCount; index += 1) {
    const t = index / sampleRate;
    samples[index] = Math.round(Math.sin(2 * Math.PI * frequency * t) * 0x2fff);
  }

  const byteRate = sampleRate * 2;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < samples.length; index += 1) {
    buffer.writeInt16LE(samples[index]!, 44 + index * 2);
  }

  return buffer;
}

async function main() {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const storageBucket = process.env.SUPABASE_STORAGE_BUCKET ?? "songs";
  const firebaseUid = process.env.SEED_DEMO_FIREBASE_UID ?? "demo-user";
  const email = process.env.SEED_DEMO_EMAIL ?? "demo@movescript.local";
  const projectTitle = process.env.SEED_PROJECT_TITLE ?? "Demo Choreo";

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .upsert(
      {
        firebase_uid: firebaseUid,
        email,
        display_name: "MoveScript Demo",
      },
      { onConflict: "firebase_uid" },
    )
    .select("id")
    .single<{ id: string }>();

  if (userError) {
    throw userError;
  }

  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .insert({
      owner_id: userRow.id,
      title: `${projectTitle} ${new Date().toISOString().slice(0, 10)}`,
      editor_view: { x: 360, y: 260, scale: 1 },
      share_enabled: true,
      share_token: crypto.randomUUID().replace(/-/g, "").slice(0, 20),
    })
    .select("id, share_token")
    .single<{ id: string; share_token: string | null }>();

  if (projectError) {
    throw projectError;
  }

  const audioPath = `${userRow.id}/${projectRow.id}/seed-tone.wav`;
  const tone = createToneWavBuffer();
  const { error: uploadError } = await supabase.storage
    .from(storageBucket)
    .upload(audioPath, tone, { upsert: true, contentType: "audio/wav" });

  if (uploadError) {
    throw uploadError;
  }

  const { data: songRow, error: songError } = await supabase
    .from("songs")
    .insert({
      project_id: projectRow.id,
      storage_path: audioPath,
      original_filename: "seed-tone.wav",
      mime_type: "audio/wav",
      file_size: tone.byteLength,
      duration_seconds: 2,
    })
    .select("id")
    .single<{ id: string }>();

  if (songError) {
    throw songError;
  }

  const { error: projectSongError } = await supabase
    .from("projects")
    .update({ song_id: songRow.id })
    .eq("id", projectRow.id);

  if (projectSongError) {
    throw projectSongError;
  }

  const { data: sceneRows, error: sceneError } = await supabase
    .from("scenes")
    .insert([
      {
        project_id: projectRow.id,
        title: "Scene 1",
        order_index: 0,
        start_time_seconds: 0,
        duration_seconds: 4,
      },
      {
        project_id: projectRow.id,
        title: "Scene 2",
        order_index: 1,
        start_time_seconds: 4,
        duration_seconds: 4,
      },
    ])
    .select("id, title")
    .returns<{ id: string; title: string }[]>();

  if (sceneError || !sceneRows) {
    throw sceneError ?? new Error("씬 생성 실패");
  }

  const { data: defs, error: defError } = await supabase
    .from("character_defs")
    .insert([
      {
        project_id: projectRow.id,
        stable_key: "alpha",
        default_label: "A",
        default_display_mode: "name",
        default_shape: "circle",
      },
      {
        project_id: projectRow.id,
        stable_key: "beta",
        default_label: "B",
        default_display_mode: "name",
        default_shape: "square",
      },
    ])
    .select("id, stable_key")
    .returns<{ id: string; stable_key: string }[]>();

  if (defError || !defs) {
    throw defError ?? new Error("character_defs 생성 실패");
  }

  const alpha = defs.find((item) => item.stable_key === "alpha");
  const beta = defs.find((item) => item.stable_key === "beta");

  const { error: peopleError } = await supabase.from("scene_people").insert([
    {
      scene_id: sceneRows[0]!.id,
      character_def_id: alpha!.id,
      x: 140,
      y: 160,
      is_present: true,
      label_override: "A",
      display_mode: "name",
      shape: "circle",
      move_duration_seconds: 2,
      entry_type: "carry",
      exit_type: "stay",
      exit_direction: "front",
    },
    {
      scene_id: sceneRows[0]!.id,
      character_def_id: beta!.id,
      x: 260,
      y: 160,
      is_present: true,
      label_override: "B",
      display_mode: "name",
      shape: "square",
      move_duration_seconds: 2,
      entry_type: "carry",
      exit_type: "stay",
      exit_direction: "front",
    },
    {
      scene_id: sceneRows[1]!.id,
      character_def_id: alpha!.id,
      x: 260,
      y: 220,
      is_present: true,
      label_override: "A",
      display_mode: "name",
      shape: "circle",
      move_duration_seconds: 2,
      entry_type: "carry",
      exit_type: "stay",
      exit_direction: "front",
    },
    {
      scene_id: sceneRows[1]!.id,
      character_def_id: beta!.id,
      x: 380,
      y: 220,
      is_present: true,
      label_override: "B",
      display_mode: "name",
      shape: "square",
      move_duration_seconds: 2,
      entry_type: "carry",
      exit_type: "stay",
      exit_direction: "front",
    },
  ]);

  if (peopleError) {
    throw peopleError;
  }

  console.log("Seed complete");
  console.log(`Project ID: ${projectRow.id}`);
  console.log(`Share token: ${projectRow.share_token}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
