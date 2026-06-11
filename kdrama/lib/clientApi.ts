import { z } from "zod";
import { getStoredApiKey } from "./apiKey";
import { buildPersonaPrompt } from "./prompts/persona";
import { buildStoryPrompt } from "./prompts/story";
import { buildCopyPrompt } from "./prompts/copy";
import { buildVeoPrompt } from "./prompts/veo";
import { buildFilmoraPrompt } from "./prompts/filmora";
import { buildCanvaPrompt } from "./prompts/canva";
import { buildNanoBananaPrompt } from "./prompts/nanobanana";
import { extractPersonaFromText } from "./persona";
import { extractEpisodesFromText } from "./story";
import { extractCopyFromText } from "./copy";
import type {
  PersonaTraits,
  Episode,
  SalesCopy,
  VeoOutput,
  FilmoraOutput,
  CanvaOutput,
  NaNoBananaOutput,
} from "./types";

const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

async function callAnthropic(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error(
      "APIキーが設定されていません。画面上部でAnthropicのAPIキーを入力してください。"
    );
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message;
    throw new Error(msg ?? `API呼び出しに失敗しました (${response.status})`);
  }

  const data = await response.json();
  const block = data.content?.[0];
  return block?.type === "text" ? block.text : "";
}

function extractFirstJsonObject(text: string): string {
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === "}") {
      depth--;
      if (depth === 0 && start !== -1) return text.slice(start, i + 1);
    }
  }
  return "";
}

// ---- ペルソナ分析 ----

export async function analyzePersona(snsPostsText: string): Promise<PersonaTraits> {
  const text = await callAnthropic(buildPersonaPrompt(snsPostsText), 1024);
  return extractPersonaFromText(text);
}

// ---- 13話ストーリー生成 ----

export async function generateStory(persona: PersonaTraits): Promise<Episode[]> {
  const text = await callAnthropic(buildStoryPrompt(persona), 4096);
  return extractEpisodesFromText(text);
}

// ---- PASONAセールスコピー生成 ----

export async function generateCopy(
  persona: PersonaTraits,
  productName: string
): Promise<SalesCopy> {
  const text = await callAnthropic(buildCopyPrompt(persona, productName), 2048);
  return extractCopyFromText(text);
}

// ---- Veoプロンプト生成 ----

const VeoOutputSchema = z.object({
  globalStyle: z.object({
    cinematicStyle: z.string(),
    colorGrading: z.string(),
    referenceFilms: z.array(z.string()),
  }),
  scenes: z.array(
    z.object({
      sceneId: z.string(),
      label: z.string(),
      episodeRef: z.number().nullish().transform((v) => v ?? undefined),
      prompt: z.string(),
      durationHint: z.string(),
      aspectRatio: z.enum(["16:9", "9:16", "1:1"]),
      cameraMotion: z.string(),
      moodKeywords: z.array(z.string()),
    })
  ),
});

export async function generateVeo(
  persona: PersonaTraits,
  episodes: Episode[],
  sessionId: string
): Promise<VeoOutput> {
  const text = await callAnthropic(buildVeoPrompt(persona, episodes), 4096);
  const jsonStr = extractFirstJsonObject(text);
  if (!jsonStr) throw new Error("Veoプロンプト生成に失敗しました");
  const parsed = VeoOutputSchema.parse(JSON.parse(jsonStr));
  return {
    tool: "veo",
    sessionId,
    generatedAt: new Date().toISOString(),
    persona: { dominantType: persona.dominantType, description: persona.description },
    ...parsed,
  };
}

// ---- Filmora絵コンテ生成 ----

const FilmoraOutputSchema = z.object({
  projectSettings: z.object({
    resolution: z.enum(["1920x1080", "1080x1920"]),
    fps: z.literal(30),
    totalDurationSec: z.number(),
  }),
  bgmTracks: z.array(
    z.object({
      trackId: z.string(),
      label: z.string(),
      genre: z.string(),
      mood: z.string(),
      bpm: z.number(),
      startTimeSec: z.number(),
      endTimeSec: z.number(),
      fadeInSec: z.number(),
      fadeOutSec: z.number(),
    })
  ),
  cuts: z.array(
    z.object({
      cutId: z.string(),
      episodeRef: z.number(),
      startTimeSec: z.number(),
      endTimeSec: z.number(),
      sceneDescription: z.string(),
      transition: z.enum(["fade", "cut", "dissolve", "zoom"]),
      textOverlay: z
        .object({
          text: z.string(),
          style: z.enum(["title", "subtitle", "caption"]),
          positionX: z.enum(["left", "center", "right"]),
          positionY: z.enum(["top", "middle", "bottom"]),
          durationSec: z.number(),
          fontColor: z.string(),
        })
        .optional(),
      bgmTrackRef: z.string(),
      videoSourceHint: z.string(),
    })
  ),
});

export async function generateFilmora(
  persona: PersonaTraits,
  episodes: Episode[],
  sessionId: string
): Promise<FilmoraOutput> {
  const text = await callAnthropic(buildFilmoraPrompt(persona, episodes), 6000);
  const jsonStr = extractFirstJsonObject(text);
  if (!jsonStr) throw new Error("Filmora絵コンテ生成に失敗しました");
  const parsed = FilmoraOutputSchema.parse(JSON.parse(jsonStr));
  return {
    tool: "filmora",
    sessionId,
    generatedAt: new Date().toISOString(),
    ...parsed,
  };
}

// ---- Canvaサムネイル生成 ----

const CanvaOutputSchema = z.object({
  brandKit: z.object({
    colorPalette: z.array(z.string()),
    fontPrimary: z.string(),
    fontSecondary: z.string(),
  }),
  thumbnails: z.array(
    z.object({
      thumbnailId: z.string(),
      label: z.string(),
      format: z.string(),
      usage: z.string(),
      layout: z.object({
        backgroundType: z.enum(["gradient", "solid", "image"]),
        backgroundColors: z.array(z.string()),
        mainImagePlacement: z.enum(["left", "right", "center", "full"]),
        textAlignment: z.enum(["left", "center", "right"]),
      }),
      layers: z.array(
        z.object({
          layerId: z.string(),
          type: z.enum(["text", "shape", "image_placeholder", "gradient_overlay"]),
          content: z.string().nullish().transform((v) => v ?? undefined),
          style: z
            .object({
              fontSize: z.number().optional(),
              fontFamily: z.string().optional(),
              color: z.string().optional(),
              bold: z.boolean().optional(),
              opacity: z.number().optional(),
            })
            .nullish()
            .transform((v) => v ?? undefined),
          position: z.object({
            x: z.string(),
            y: z.string(),
            width: z.string().optional(),
            height: z.string().optional(),
          }),
        })
      ),
    })
  ),
});

export async function generateCanva(
  persona: PersonaTraits,
  episodes: Episode[],
  copy: SalesCopy | undefined,
  sessionId: string
): Promise<CanvaOutput> {
  const text = await callAnthropic(buildCanvaPrompt(persona, episodes, copy), 5000);
  const jsonStr = extractFirstJsonObject(text);
  if (!jsonStr) throw new Error("Canvaサムネイル生成に失敗しました");
  const parsed = CanvaOutputSchema.parse(JSON.parse(jsonStr));
  return {
    tool: "canva",
    sessionId,
    generatedAt: new Date().toISOString(),
    ...parsed,
  };
}

// ---- NaNoBananaプロンプト生成 ----

const NaNoBananaOutputSchema = z.object({
  globalStyle: z.object({
    style: z.string(),
    colorPalette: z.array(z.string()),
  }),
  scenes: z.array(
    z.object({
      sceneId: z.string(),
      label: z.string(),
      episodeRef: z.number().nullish().transform((v) => v ?? undefined),
      prompt: z.string(),
      durationHint: z.string(),
      style: z.string(),
      aspectRatio: z.enum(["16:9", "9:16", "1:1"]),
      fps: z.union([z.literal(24), z.literal(30)]),
    })
  ),
});

export async function generateNanoBanana(
  persona: PersonaTraits,
  episodes: Episode[],
  sessionId: string
): Promise<NaNoBananaOutput> {
  const text = await callAnthropic(buildNanoBananaPrompt(persona, episodes), 4096);
  const jsonStr = extractFirstJsonObject(text);
  if (!jsonStr) throw new Error("NaNoBananaプロンプト生成に失敗しました");
  const parsed = NaNoBananaOutputSchema.parse(JSON.parse(jsonStr));
  return {
    tool: "nanobanana",
    sessionId,
    generatedAt: new Date().toISOString(),
    persona: { dominantType: persona.dominantType, description: persona.description },
    ...parsed,
  };
}
