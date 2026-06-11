import { describe, it, expect } from "vitest";
import {
  extractPersonaFromText,
  getTopTrait,
  sumScores,
  isDominantTypeValid,
  PersonaSchema,
  TRAIT_KEYS,
} from "../persona";
import { buildPersonaPrompt } from "../prompts/persona";

// テスト用のベースペルソナ
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

// 有効なペルソナJSONを含む文字列を生成するヘルパー
function wrapInProse(json: object): string {
  return `分析結果は以下の通りです：\n${JSON.stringify(json)}\n以上です。`;
}

// ---- extractPersonaFromText ----

describe("extractPersonaFromText", () => {
  it("純粋なJSONテキストから正しくパースできる", () => {
    const result = extractPersonaFromText(JSON.stringify(basePersona));
    expect(result.approval).toBe(9);
    expect(result.dominantType).toBe("承認欲求型");
  });

  it("散文の中に埋め込まれたJSONを抽出できる", () => {
    const text = wrapInProse(basePersona);
    const result = extractPersonaFromText(text);
    expect(result.vanity).toBe(8);
    expect(result.description).toBeTruthy();
  });

  it("JSONが存在しない場合にエラーを投げる", () => {
    expect(() => extractPersonaFromText("分析できませんでした。")).toThrow(
      "JSONが含まれていません"
    );
  });

  it("不正なJSON文字列の場合にエラーを投げる", () => {
    expect(() => extractPersonaFromText("{ vanity: 8, broken }")).toThrow(
      "JSONのパースに失敗しました"
    );
  });

  it("スコアが10を超える場合にZodエラーを投げる", () => {
    const invalid = { ...basePersona, vanity: 11 };
    expect(() => extractPersonaFromText(JSON.stringify(invalid))).toThrow();
  });

  it("スコアが0未満の場合にZodエラーを投げる", () => {
    const invalid = { ...basePersona, anxiety: -1 };
    expect(() => extractPersonaFromText(JSON.stringify(invalid))).toThrow();
  });

  it("必須フィールドが欠けている場合にZodエラーを投げる", () => {
    const { dominantType: _d, ...withoutDominant } = basePersona;
    expect(() =>
      extractPersonaFromText(JSON.stringify(withoutDominant))
    ).toThrow();
  });

  it("dominantType が空文字の場合にZodエラーを投げる", () => {
    const invalid = { ...basePersona, dominantType: "" };
    expect(() => extractPersonaFromText(JSON.stringify(invalid))).toThrow();
  });

  it("description が空文字の場合にZodエラーを投げる", () => {
    const invalid = { ...basePersona, description: "" };
    expect(() => extractPersonaFromText(JSON.stringify(invalid))).toThrow();
  });

  it("スコアが 0 の境界値を許容する", () => {
    const edge = { ...basePersona, vanity: 0, jealousy: 0 };
    const result = extractPersonaFromText(JSON.stringify(edge));
    expect(result.vanity).toBe(0);
  });

  it("スコアが 10 の境界値を許容する", () => {
    const edge = { ...basePersona, vanity: 10 };
    const result = extractPersonaFromText(JSON.stringify(edge));
    expect(result.vanity).toBe(10);
  });

  it("複数のJSONブロックがある場合は最初のブロックを使う", () => {
    const first = { ...basePersona, vanity: 3 };
    const second = { ...basePersona, vanity: 9 };
    const text = `${JSON.stringify(first)} そして ${JSON.stringify(second)}`;
    const result = extractPersonaFromText(text);
    expect(result.vanity).toBe(3);
  });
});

// ---- getTopTrait ----

describe("getTopTrait", () => {
  it("最高スコアのトレイトキーを返す", () => {
    expect(getTopTrait(basePersona)).toBe("approval");
  });

  it("すべてのスコアが同じ場合は TRAIT_KEYS の先頭を返す", () => {
    const allSame = { ...basePersona, ...Object.fromEntries(TRAIT_KEYS.map((k) => [k, 5])) };
    expect(getTopTrait(allSame)).toBe(TRAIT_KEYS[0]);
  });

  it("vanity が最大の場合は 'vanity' を返す", () => {
    const persona = { ...basePersona, vanity: 10, approval: 8 };
    expect(getTopTrait(persona)).toBe("vanity");
  });

  it("loveSeeking が最大の場合は 'loveSeeking' を返す", () => {
    const persona = {
      ...basePersona,
      ...Object.fromEntries(TRAIT_KEYS.map((k) => [k, 1])),
      loveSeeking: 10,
    };
    expect(getTopTrait(persona)).toBe("loveSeeking");
  });
});

// ---- sumScores ----

describe("sumScores", () => {
  it("7軸スコアの合計を正しく計算する", () => {
    // 8+6+9+5+7+4+6 = 45
    expect(sumScores(basePersona)).toBe(45);
  });

  it("全スコアが0の場合は0を返す", () => {
    const zero = { ...basePersona, ...Object.fromEntries(TRAIT_KEYS.map((k) => [k, 0])) };
    expect(sumScores(zero)).toBe(0);
  });

  it("全スコアが10の場合は70を返す", () => {
    const max = { ...basePersona, ...Object.fromEntries(TRAIT_KEYS.map((k) => [k, 10])) };
    expect(sumScores(max)).toBe(70);
  });
});

// ---- isDominantTypeValid ----

describe("isDominantTypeValid", () => {
  it("有効な日本語トレイト名を含む場合は true を返す", () => {
    expect(isDominantTypeValid("承認欲求型")).toBe(true);
    expect(isDominantTypeValid("虚栄心型")).toBe(true);
    expect(isDominantTypeValid("嫉妬型")).toBe(true);
    expect(isDominantTypeValid("孤独感が強い承認欲求型")).toBe(true);
  });

  it("無関係な文字列の場合は false を返す", () => {
    expect(isDominantTypeValid("不明")).toBe(false);
    expect(isDominantTypeValid("")).toBe(false);
    expect(isDominantTypeValid("type_A")).toBe(false);
  });
});

// ---- PersonaSchema（Zod バリデーション単体） ----

describe("PersonaSchema", () => {
  it("有効なオブジェクトをパースできる", () => {
    const result = PersonaSchema.parse(basePersona);
    expect(result).toMatchObject(basePersona);
  });

  it("スコアが整数でない場合もパースを許容する（Zod number は浮動小数も通す）", () => {
    const withFloat = { ...basePersona, vanity: 7.5 };
    const result = PersonaSchema.parse(withFloat);
    expect(result.vanity).toBe(7.5);
  });

  it("余分なフィールドは除去される（strict でない場合）", () => {
    const withExtra = { ...basePersona, unknownField: "test" };
    const result = PersonaSchema.parse(withExtra);
    expect((result as Record<string, unknown>).unknownField).toBeUndefined();
  });
});

// ---- buildPersonaPrompt ----

describe("buildPersonaPrompt", () => {
  const sampleText = "最近またブランドバッグ買った✨ みんなの反応が楽しみ";

  it("SNSテキストがプロンプトに含まれる", () => {
    const prompt = buildPersonaPrompt(sampleText);
    expect(prompt).toContain(sampleText);
  });

  it("7つのトレイト名がプロンプトに含まれる", () => {
    const prompt = buildPersonaPrompt(sampleText);
    expect(prompt).toContain("vanity");
    expect(prompt).toContain("jealousy");
    expect(prompt).toContain("approval");
    expect(prompt).toContain("loneliness");
    expect(prompt).toContain("ambition");
    expect(prompt).toContain("anxiety");
    expect(prompt).toContain("loveSeeking");
  });

  it("JSON形式の指示がプロンプトに含まれる", () => {
    const prompt = buildPersonaPrompt(sampleText);
    expect(prompt).toContain("JSON");
    expect(prompt).toContain("dominantType");
    expect(prompt).toContain("description");
  });

  it("プロンプトが100文字以上の長さを持つ", () => {
    const prompt = buildPersonaPrompt(sampleText);
    expect(prompt.length).toBeGreaterThan(100);
  });

  it("空文字列でも例外を投げずにプロンプトを生成する", () => {
    expect(() => buildPersonaPrompt("")).not.toThrow();
  });

  it("特殊文字を含むSNSテキストでも例外を投げない", () => {
    const specialText = "✨🌟💕 #いいね返し @user <script>alert(1)</script>";
    expect(() => buildPersonaPrompt(specialText)).not.toThrow();
  });
});
