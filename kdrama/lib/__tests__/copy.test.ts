import { describe, it, expect } from "vitest";
import {
  extractCopyFromText,
  isValidCopy,
  pasonaFieldsPresent,
  hasEnoughEmailSubjectLines,
  SalesCopySchema,
} from "../copy";
import { buildCopyPrompt } from "../prompts/copy";

// テスト用のベース SalesCopy
const baseCopy = {
  headline: "あなたの人生を変える一冊",
  subheadline: "承認欲求に悩むあなたへ贈る処方箋",
  painPoints: [
    "いいねの数で自分の価値を決めてしまう",
    "他人の投稿を見るたびに焦りを感じる",
    "本当の自分を誰にも見せられない",
  ],
  promises: [
    "30日で自己肯定感が劇的に向上する",
    "SNSに縛られない自由な生き方を手に入れる",
    "心から信頼できる人間関係を築ける",
  ],
  cta: "今すぐ無料で試す",
  socialProof: "すでに10,000人以上が実践し、92%が満足と回答しています。",
  emailSubjectLines: [
    "【緊急】あなたのSNS依存が危険なレベルに達しています",
    "いいねゼロでも幸せになれる方法を発見しました",
    "承認欲求から解放された私の体験談",
    "30日間チャレンジ：自己肯定感を取り戻す旅",
    "なぜあなたはSNSをやめられないのか",
  ],
};

// 散文に埋め込むヘルパー
function wrapInProse(json: unknown): string {
  return `セールスコピーの生成結果：\n${JSON.stringify(json)}\n以上が生成結果です。`;
}

// ---- extractCopyFromText ----

describe("extractCopyFromText", () => {
  it("純粋なJSONテキストから正しくパースできる", () => {
    const result = extractCopyFromText(JSON.stringify(baseCopy));
    expect(result.headline).toBe(baseCopy.headline);
    expect(result.cta).toBe(baseCopy.cta);
  });

  it("散文の中に埋め込まれたJSONを抽出できる", () => {
    const text = wrapInProse(baseCopy);
    const result = extractCopyFromText(text);
    expect(result.headline).toBe(baseCopy.headline);
    expect(result.painPoints).toHaveLength(3);
  });

  it("JSONが存在しない場合にエラーを投げる", () => {
    expect(() => extractCopyFromText("生成できませんでした。")).toThrow(
      "レスポンスにJSONが含まれていません"
    );
  });

  it("不正なJSON文字列の場合にエラーを投げる", () => {
    expect(() => extractCopyFromText("{ headline: broken }")).toThrow(
      "JSONのパースに失敗しました"
    );
  });

  it("headline が空文字の場合にZodエラーを投げる", () => {
    const invalid = { ...baseCopy, headline: "" };
    expect(() => extractCopyFromText(JSON.stringify(invalid))).toThrow();
  });

  it("subheadline が欠けている場合にZodエラーを投げる", () => {
    const { subheadline: _s, ...noSub } = baseCopy;
    expect(() => extractCopyFromText(JSON.stringify(noSub))).toThrow();
  });

  it("painPoints が空配列の場合にZodエラーを投げる", () => {
    const invalid = { ...baseCopy, painPoints: [] };
    expect(() => extractCopyFromText(JSON.stringify(invalid))).toThrow();
  });

  it("promises が空配列の場合にZodエラーを投げる", () => {
    const invalid = { ...baseCopy, promises: [] };
    expect(() => extractCopyFromText(JSON.stringify(invalid))).toThrow();
  });

  it("emailSubjectLines が空配列の場合にZodエラーを投げる", () => {
    const invalid = { ...baseCopy, emailSubjectLines: [] };
    expect(() => extractCopyFromText(JSON.stringify(invalid))).toThrow();
  });

  it("cta が空文字の場合にZodエラーを投げる", () => {
    const invalid = { ...baseCopy, cta: "" };
    expect(() => extractCopyFromText(JSON.stringify(invalid))).toThrow();
  });

  it("socialProof が空文字の場合にZodエラーを投げる", () => {
    const invalid = { ...baseCopy, socialProof: "" };
    expect(() => extractCopyFromText(JSON.stringify(invalid))).toThrow();
  });

  it("全フィールドが正しく抽出される", () => {
    const result = extractCopyFromText(JSON.stringify(baseCopy));
    expect(result.promises).toHaveLength(3);
    expect(result.emailSubjectLines).toHaveLength(5);
    expect(result.socialProof).toBe(baseCopy.socialProof);
  });

  it("複数のJSONブロックがある場合は最初のブロックを使う", () => {
    const first = { ...baseCopy, headline: "最初のコピー" };
    const second = { ...baseCopy, headline: "2番目のコピー" };
    const text = `${JSON.stringify(first)} そして ${JSON.stringify(second)}`;
    const result = extractCopyFromText(text);
    expect(result.headline).toBe("最初のコピー");
  });
});

// ---- isValidCopy ----

describe("isValidCopy", () => {
  it("有効な SalesCopy オブジェクトで true を返す", () => {
    expect(isValidCopy(baseCopy)).toBe(true);
  });

  it("null は false を返す", () => {
    expect(isValidCopy(null)).toBe(false);
  });

  it("undefined は false を返す", () => {
    expect(isValidCopy(undefined)).toBe(false);
  });

  it("必須フィールドが欠けている場合は false を返す", () => {
    const { headline: _h, ...noCopy } = baseCopy;
    expect(isValidCopy(noCopy)).toBe(false);
  });

  it("painPoints が空配列の場合は false を返す", () => {
    expect(isValidCopy({ ...baseCopy, painPoints: [] })).toBe(false);
  });

  it("型ガードとして動作し、trueの場合に SalesCopy として使える", () => {
    const data: unknown = baseCopy;
    if (isValidCopy(data)) {
      expect(data.cta).toBeTruthy();
    } else {
      throw new Error("型ガードが機能していない");
    }
  });
});

// ---- pasonaFieldsPresent ----

describe("pasonaFieldsPresent", () => {
  it("全PASONAフィールドが揃っている場合は true を返す", () => {
    expect(pasonaFieldsPresent(baseCopy)).toBe(true);
  });

  it("painPoints が空の場合は false を返す（Problem/Agitationなし）", () => {
    expect(pasonaFieldsPresent({ ...baseCopy, painPoints: [] })).toBe(false);
  });

  it("promises が空の場合は false を返す（Solutionなし）", () => {
    expect(pasonaFieldsPresent({ ...baseCopy, promises: [] })).toBe(false);
  });

  it("headline が空の場合は false を返す（Offerなし）", () => {
    expect(pasonaFieldsPresent({ ...baseCopy, headline: "" })).toBe(false);
  });

  it("subheadline が空の場合は false を返す（Offerなし）", () => {
    expect(pasonaFieldsPresent({ ...baseCopy, subheadline: "" })).toBe(false);
  });

  it("socialProof が空の場合は false を返す（Narrowingなし）", () => {
    expect(pasonaFieldsPresent({ ...baseCopy, socialProof: "" })).toBe(false);
  });

  it("cta が空の場合は false を返す（Actionなし）", () => {
    expect(pasonaFieldsPresent({ ...baseCopy, cta: "" })).toBe(false);
  });

  it("painPoints が1件でも true を返す", () => {
    expect(pasonaFieldsPresent({ ...baseCopy, painPoints: ["一つの痛み"] })).toBe(true);
  });
});

// ---- hasEnoughEmailSubjectLines ----

describe("hasEnoughEmailSubjectLines", () => {
  it("件名が minCount 以上の場合は true を返す", () => {
    expect(hasEnoughEmailSubjectLines(baseCopy, 5)).toBe(true);
    expect(hasEnoughEmailSubjectLines(baseCopy, 3)).toBe(true);
    expect(hasEnoughEmailSubjectLines(baseCopy, 1)).toBe(true);
  });

  it("件名がちょうど minCount の場合は true を返す", () => {
    const copy = { ...baseCopy, emailSubjectLines: ["件名1", "件名2", "件名3"] };
    expect(hasEnoughEmailSubjectLines(copy, 3)).toBe(true);
  });

  it("件名が minCount 未満の場合は false を返す", () => {
    const copy = { ...baseCopy, emailSubjectLines: ["件名1", "件名2"] };
    expect(hasEnoughEmailSubjectLines(copy, 3)).toBe(false);
  });

  it("件名が空の場合は minCount=1 で false を返す", () => {
    const copy = { ...baseCopy, emailSubjectLines: [] };
    expect(hasEnoughEmailSubjectLines(copy, 1)).toBe(false);
  });

  it("minCount が0の場合は常に true を返す", () => {
    expect(hasEnoughEmailSubjectLines(baseCopy, 0)).toBe(true);
    const empty = { ...baseCopy, emailSubjectLines: [] };
    expect(hasEnoughEmailSubjectLines(empty, 0)).toBe(true);
  });
});

// ---- SalesCopySchema（Zod 単体） ----

describe("SalesCopySchema", () => {
  it("有効なオブジェクトをパースできる", () => {
    const result = SalesCopySchema.parse(baseCopy);
    expect(result).toMatchObject(baseCopy);
  });

  it("余分なフィールドは除去される", () => {
    const withExtra = { ...baseCopy, unknownField: "test" };
    const result = SalesCopySchema.parse(withExtra);
    expect((result as Record<string, unknown>).unknownField).toBeUndefined();
  });

  it("painPoints の要素に空文字がある場合はZodエラーを投げる", () => {
    const invalid = { ...baseCopy, painPoints: ["有効", ""] };
    expect(() => SalesCopySchema.parse(invalid)).toThrow();
  });

  it("promises の要素に空文字がある場合はZodエラーを投げる", () => {
    const invalid = { ...baseCopy, promises: ["", "有効"] };
    expect(() => SalesCopySchema.parse(invalid)).toThrow();
  });

  it("emailSubjectLines の要素に空文字がある場合はZodエラーを投げる", () => {
    const invalid = { ...baseCopy, emailSubjectLines: ["有効", ""] };
    expect(() => SalesCopySchema.parse(invalid)).toThrow();
  });
});

// ---- buildCopyPrompt ----

describe("buildCopyPrompt", () => {
  const basePersona = {
    vanity: 8,
    jealousy: 6,
    approval: 9,
    loneliness: 5,
    ambition: 7,
    anxiety: 4,
    loveSeeking: 6,
    dominantType: "承認欲求型",
    description: "他者からの評価に強く依存し、いいねやフォロワー数で自己価値を測る人物。",
  };
  const productName = "メンタル強化プログラム";

  it("プロンプトに商品名が含まれる", () => {
    const prompt = buildCopyPrompt(basePersona, productName);
    expect(prompt).toContain(productName);
  });

  it("プロンプトにペルソナの dominantType が含まれる", () => {
    const prompt = buildCopyPrompt(basePersona, productName);
    expect(prompt).toContain("承認欲求型");
  });

  it("プロンプトにJSON形式フィールドが含まれる", () => {
    const prompt = buildCopyPrompt(basePersona, productName);
    expect(prompt).toContain("headline");
    expect(prompt).toContain("subheadline");
    expect(prompt).toContain("painPoints");
    expect(prompt).toContain("promises");
    expect(prompt).toContain("cta");
    expect(prompt).toContain("socialProof");
    expect(prompt).toContain("emailSubjectLines");
  });

  it("プロンプトが100文字以上の長さを持つ", () => {
    expect(buildCopyPrompt(basePersona, productName).length).toBeGreaterThan(100);
  });

  it("空の商品名でも例外を投げずにプロンプトを生成する", () => {
    expect(() => buildCopyPrompt(basePersona, "")).not.toThrow();
  });

  it("特殊文字を含む商品名でも例外を投げない", () => {
    expect(() =>
      buildCopyPrompt(basePersona, '商品名 <script>alert("xss")</script>')
    ).not.toThrow();
  });
});
