import { z } from "zod";
import type { PersonaTraits } from "./types";

export const PersonaSchema = z.object({
  vanity: z.number().min(0).max(10),
  jealousy: z.number().min(0).max(10),
  approval: z.number().min(0).max(10),
  loneliness: z.number().min(0).max(10),
  ambition: z.number().min(0).max(10),
  anxiety: z.number().min(0).max(10),
  loveSeeking: z.number().min(0).max(10),
  dominantType: z.string().min(1),
  description: z.string().min(1),
});

export const TRAIT_KEYS = [
  "vanity",
  "jealousy",
  "approval",
  "loneliness",
  "ambition",
  "anxiety",
  "loveSeeking",
] as const;

export type TraitKey = (typeof TRAIT_KEYS)[number];

export const TRAIT_LABEL: Record<TraitKey, string> = {
  vanity: "虚栄心",
  jealousy: "嫉妬",
  approval: "承認欲求",
  loneliness: "孤独感",
  ambition: "野心",
  anxiety: "不安",
  loveSeeking: "愛情渇望",
};

/** テキストから最初の完結した JSON オブジェクト文字列を取り出す（ネスト・複数ブロック対応） */
function extractFirstJsonString(text: string): string {
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
    }
  }
  return "";
}

/** LLM レスポンスのテキストから PersonaTraits を抽出・検証する */
export function extractPersonaFromText(text: string): PersonaTraits {
  const jsonStr = extractFirstJsonString(text);
  if (!jsonStr) {
    throw new Error("レスポンスにJSONが含まれていません");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(jsonStr);
  } catch {
    throw new Error("JSONのパースに失敗しました");
  }

  return PersonaSchema.parse(raw);
}

/** スコアが最も高いトレイトキーを返す（同点の場合は TRAIT_KEYS の先頭優先） */
export function getTopTrait(persona: PersonaTraits): TraitKey {
  return TRAIT_KEYS.reduce(
    (top, key) => (persona[key] > persona[top] ? key : top),
    TRAIT_KEYS[0]
  );
}

/** 7軸スコアの合計を返す */
export function sumScores(persona: PersonaTraits): number {
  return TRAIT_KEYS.reduce((sum, key) => sum + persona[key], 0);
}

/** dominantType が TRAIT_LABEL のいずれかを含むか確認する */
export function isDominantTypeValid(dominantType: string): boolean {
  return Object.values(TRAIT_LABEL).some((label) =>
    dominantType.includes(label)
  );
}
