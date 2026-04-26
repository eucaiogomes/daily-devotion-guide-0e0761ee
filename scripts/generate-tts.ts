/**
 * Pre-generates ElevenLabs audio for every unique English phrase used in the app
 * (psalm verses, keywords, and memory verses) and writes them as MP3 files into
 * `public/audio/tts/`.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... bun run scripts/generate-tts.ts
 *
 * The filename is the SHA1 hex of `${voiceId}|${text}` so the client can resolve
 * URLs deterministically without a manifest lookup.
 */
import { createHash } from "crypto";
import { mkdir, writeFile, access } from "fs/promises";
import { join } from "path";
import { PSALMS } from "../src/data/psalms";

const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah
const MODEL_ID = "eleven_turbo_v2_5";
const OUT_DIR = join(process.cwd(), "public", "audio", "tts");

function hashKey(voiceId: string, text: string) {
  return createHash("sha1").update(`${voiceId}|${text}`).digest("hex");
}

async function fileExists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function generate(text: string, apiKey: string) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${err}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("Missing ELEVENLABS_API_KEY env var");
    process.exit(1);
  }

  // Collect unique strings across the whole library.
  const set = new Set<string>();
  for (const p of PSALMS) {
    for (const v of p.verses) set.add(v.en);
    for (const k of p.keywords) set.add(k.en);
    set.add(p.memoryVerse.en);
  }
  const phrases = [...set];
  console.log(`Found ${phrases.length} unique phrases.`);

  await mkdir(OUT_DIR, { recursive: true });

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < phrases.length; i++) {
    const text = phrases[i];
    const id = hashKey(VOICE_ID, text);
    const file = join(OUT_DIR, `${id}.mp3`);
    if (await fileExists(file)) {
      skipped++;
      continue;
    }
    try {
      const buf = await generate(text, apiKey);
      await writeFile(file, buf);
      generated++;
      console.log(
        `[${i + 1}/${phrases.length}] ✓ ${id.slice(0, 8)} (${buf.length}B) — ${text.slice(0, 60)}`,
      );
      // Be polite to the API — small delay between requests.
      await new Promise((r) => setTimeout(r, 250));
    } catch (e) {
      failed++;
      console.error(
        `[${i + 1}/${phrases.length}] ✗ ${text.slice(0, 60)} — ${(e as Error).message}`,
      );
    }
  }

  console.log(
    `\nDone. Generated: ${generated}, skipped (cached): ${skipped}, failed: ${failed}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
