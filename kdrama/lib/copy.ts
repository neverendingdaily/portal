import { z } from "zod";
import type { SalesCopy } from "./types";

export const SalesCopySchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().min(1),
  painPoints: z.array(z.string().min(1)).min(1),
  promises: z.array(z.string().min(1)).min(1),
  cta: z.string().min(1),
  socialProof: z.string().min(1),
  emailSubjectLines: z.array(z.string().min(1)).min(1),
});

/** テキストから最初の完結した JSON オブジェクト文字列を取り出す */
function extractFirstJsonObject(text: string): string {
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

/** LLM レスポンスのテキストから SalesCopy を抽出・検証する */
export function extractCopyFromText(text: string): SalesCopy {
  const jsonStr = extractFirstJsonObject(text);
  if (!jsonStr) {
    throw new Error("レスポンスにJSONが含まれていません");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(jsonStr);
  } catch {
    throw new Error("JSONのパースに失敗しました");
  }

  return SalesCopySchema.parse(raw);
}

/** 値が有効な SalesCopy かどうかを型ガード付きで確認する */
export function isValidCopy(copy: unknown): copy is SalesCopy {
  return SalesCopySchema.safeParse(copy).success;
}

/**
 * PASONAの法則の各要素がセールスコピーに含まれているか確認する
 *
 * PASONA: Problem(painPoints) / Agitation(painPoints) /
 *         Solution(promises) / Offer(headline+subheadline) /
 *         Narrowing(socialProof) / Action(cta)
 */
export function pasonaFieldsPresent(copy: SalesCopy): boolean {
  return (
    copy.painPoints.length >= 1 &&
    copy.promises.length >= 1 &&
    copy.headline.length > 0 &&
    copy.subheadline.length > 0 &&
    copy.socialProof.length > 0 &&
    copy.cta.length > 0
  );
}

/** emailSubjectLines が指定本数以上含まれているか確認する */
export function hasEnoughEmailSubjectLines(
  copy: SalesCopy,
  minCount: number
): boolean {
  return copy.emailSubjectLines.length >= minCount;
}
