import { createFileRoute } from "@tanstack/react-router";

// Default voice IDs (multilingual - works great with English)
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah - warm, natural

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const apiKey = process.env.ELEVENLABS_API_KEY;
          if (!apiKey) {
            return new Response(
              JSON.stringify({ error: "ELEVENLABS_API_KEY is not configured" }),
              { status: 500, headers: { "Content-Type": "application/json" } },
            );
          }

          const body = await request.json().catch(() => ({}));
          const text = typeof body?.text === "string" ? body.text.trim() : "";
          const voiceId =
            typeof body?.voiceId === "string" && body.voiceId
              ? body.voiceId
              : DEFAULT_VOICE_ID;
          const modelId =
            typeof body?.modelId === "string" && body.modelId
              ? body.modelId
              : "eleven_turbo_v2_5";

          if (!text) {
            return new Response(
              JSON.stringify({ error: "Missing 'text'" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }
          if (text.length > 1500) {
            return new Response(
              JSON.stringify({ error: "Text too long (max 1500 chars)" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const upstream = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
            {
              method: "POST",
              headers: {
                "xi-api-key": apiKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text,
                model_id: modelId,
                voice_settings: {
                  stability: 0.45,
                  similarity_boost: 0.8,
                  style: 0.35,
                  use_speaker_boost: true,
                },
              }),
            },
          );

          if (!upstream.ok) {
            const errText = await upstream.text();
            return new Response(
              JSON.stringify({
                error: `ElevenLabs error ${upstream.status}: ${errText}`,
              }),
              {
                status: upstream.status,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const audio = await upstream.arrayBuffer();
          return new Response(audio, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=86400",
            },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
