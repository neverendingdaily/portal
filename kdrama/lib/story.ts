import { z } from "zod";
import type { Episode } from "./types";

export const EpisodeSchema = z.object({
  number: z.number().int().min(1).max(13),
  title: z.string().min(1),
  synopsis: z.string().min(1),
  keyScene: z.string().min(1),
  emotionalHook: z.string().min(1),
  cliffhanger: z.string().min(1),
});

export const EpisodesSchema = z.array(EpisodeSchema).length(13);

/** テキストから最初の完結した JSON 配列文字列を取り出す */
function extractFirstJsonArray(text: string): string {
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "[") {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === "]") {
      depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
    }
  }
  return "";
}

/** LLM レスポンスのテキストから Episode[] を抽出・検証する */
export function extractEpisodesFromText(text: string): Episode[] {
  const jsonStr = extractFirstJsonArray(text);
  if (!jsonStr) {
    throw new Error("レスポンスにJSON配列が含まれていません");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(jsonStr);
  } catch {
    throw new Error("JSONのパースに失敗しました");
  }

  return EpisodesSchema.parse(raw);
}

/** 値が有効な Episode[] かどうかを型ガード付きで確認する */
export function isValidEpisodeArray(episodes: unknown): episodes is Episode[] {
  return EpisodesSchema.safeParse(episodes).success;
}

/** 話数で Episode を検索する */
export function getEpisodeByNumber(
  episodes: Episode[],
  number: number
): Episode | undefined {
  return episodes.find((ep) => ep.number === number);
}

/** エピソード配列が1話〜13話の連番で揃っているか確認する */
export function hasCompleteEpisodeNumbers(episodes: Episode[]): boolean {
  if (episodes.length !== 13) return false;
  const sorted = [...episodes].sort((a, b) => a.number - b.number);
  return sorted.every((ep, i) => ep.number === i + 1);
}
