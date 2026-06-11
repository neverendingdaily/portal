import { describe, it, expect } from "vitest";
import {
  extractEpisodesFromText,
  isValidEpisodeArray,
  getEpisodeByNumber,
  hasCompleteEpisodeNumbers,
  EpisodeSchema,
  EpisodesSchema,
} from "../story";
import { buildStoryPrompt } from "../prompts/story";

// テスト用の最小エピソードオブジェクト
function makeEpisode(number: number) {
  return {
    number,
    title: `第${number}話タイトル`,
    synopsis: `第${number}話のあらすじです。`,
    keyScene: `見せ場シーン${number}`,
    emotionalHook: `感情フック${number}`,
    cliffhanger: `引き${number}`,
  };
}

// 13話分のエピソード配列
const validEpisodes = Array.from({ length: 13 }, (_, i) => makeEpisode(i + 1));

// 散文に埋め込むヘルパー
function wrapInProse(json: unknown): string {
  return `生成結果は以下の通りです：\n${JSON.stringify(json)}\n以上です。`;
}

// ---- extractEpisodesFromText ----

describe("extractEpisodesFromText", () => {
  it("純粋なJSON配列テキストから正しくパースできる", () => {
    const result = extractEpisodesFromText(JSON.stringify(validEpisodes));
    expect(result).toHaveLength(13);
    expect(result[0].number).toBe(1);
    expect(result[12].number).toBe(13);
  });

  it("散文の中に埋め込まれたJSON配列を抽出できる", () => {
    const text = wrapInProse(validEpisodes);
    const result = extractEpisodesFromText(text);
    expect(result).toHaveLength(13);
    expect(result[0].title).toContain("第1話");
  });

  it("JSON配列が存在しない場合にエラーを投げる", () => {
    expect(() => extractEpisodesFromText("生成できませんでした。")).toThrow(
      "レスポンスにJSON配列が含まれていません"
    );
  });

  it("不正なJSON文字列の場合にエラーを投げる", () => {
    expect(() => extractEpisodesFromText("[{ number: 1, broken }]")).toThrow(
      "JSONのパースに失敗しました"
    );
  });

  it("エピソード数が13話未満の場合にZodエラーを投げる", () => {
    const shortEpisodes = validEpisodes.slice(0, 12);
    expect(() =>
      extractEpisodesFromText(JSON.stringify(shortEpisodes))
    ).toThrow();
  });

  it("エピソード数が13話超の場合にZodエラーを投げる", () => {
    const longEpisodes = [...validEpisodes, makeEpisode(14)];
    expect(() =>
      extractEpisodesFromText(JSON.stringify(longEpisodes))
    ).toThrow();
  });

  it("title が空文字のエピソードがある場合にZodエラーを投げる", () => {
    const invalid = validEpisodes.map((ep, i) =>
      i === 0 ? { ...ep, title: "" } : ep
    );
    expect(() => extractEpisodesFromText(JSON.stringify(invalid))).toThrow();
  });

  it("synopsis が欠けているエピソードがある場合にZodエラーを投げる", () => {
    const { synopsis: _s, ...noSynopsis } = validEpisodes[0];
    const invalid = [noSynopsis, ...validEpisodes.slice(1)];
    expect(() => extractEpisodesFromText(JSON.stringify(invalid))).toThrow();
  });

  it("number が範囲外（0）の場合にZodエラーを投げる", () => {
    const invalid = [{ ...validEpisodes[0], number: 0 }, ...validEpisodes.slice(1)];
    expect(() => extractEpisodesFromText(JSON.stringify(invalid))).toThrow();
  });

  it("number が範囲外（14）の場合にZodエラーを投げる", () => {
    const invalid = validEpisodes.map((ep, i) =>
      i === 0 ? { ...ep, number: 14 } : ep
    );
    expect(() => extractEpisodesFromText(JSON.stringify(invalid))).toThrow();
  });

  it("空の配列の場合にZodエラーを投げる", () => {
    expect(() => extractEpisodesFromText("[]")).toThrow();
  });

  it("全フィールドが正しく抽出される", () => {
    const result = extractEpisodesFromText(JSON.stringify(validEpisodes));
    const ep = result[5];
    expect(ep.number).toBe(6);
    expect(ep.title).toBe("第6話タイトル");
    expect(ep.synopsis).toBeTruthy();
    expect(ep.keyScene).toBeTruthy();
    expect(ep.emotionalHook).toBeTruthy();
    expect(ep.cliffhanger).toBeTruthy();
  });
});

// ---- isValidEpisodeArray ----

describe("isValidEpisodeArray", () => {
  it("有効な13話配列で true を返す", () => {
    expect(isValidEpisodeArray(validEpisodes)).toBe(true);
  });

  it("話数が12の場合は false を返す", () => {
    expect(isValidEpisodeArray(validEpisodes.slice(0, 12))).toBe(false);
  });

  it("null は false を返す", () => {
    expect(isValidEpisodeArray(null)).toBe(false);
  });

  it("空配列は false を返す", () => {
    expect(isValidEpisodeArray([])).toBe(false);
  });

  it("必須フィールドが欠けている場合は false を返す", () => {
    const invalid = validEpisodes.map((ep, i) =>
      i === 0 ? { ...ep, title: undefined } : ep
    );
    expect(isValidEpisodeArray(invalid)).toBe(false);
  });

  it("型ガードとして動作し、trueの場合に Episode[] として使える", () => {
    const data: unknown = validEpisodes;
    if (isValidEpisodeArray(data)) {
      expect(data[0].title).toBeTruthy();
    } else {
      throw new Error("型ガードが機能していない");
    }
  });
});

// ---- getEpisodeByNumber ----

describe("getEpisodeByNumber", () => {
  it("存在する話数の Episode を返す", () => {
    const ep = getEpisodeByNumber(validEpisodes, 7);
    expect(ep).toBeDefined();
    expect(ep?.number).toBe(7);
    expect(ep?.title).toBe("第7話タイトル");
  });

  it("第1話を正しく返す", () => {
    const ep = getEpisodeByNumber(validEpisodes, 1);
    expect(ep?.number).toBe(1);
  });

  it("第13話を正しく返す", () => {
    const ep = getEpisodeByNumber(validEpisodes, 13);
    expect(ep?.number).toBe(13);
  });

  it("存在しない話数の場合は undefined を返す", () => {
    expect(getEpisodeByNumber(validEpisodes, 0)).toBeUndefined();
    expect(getEpisodeByNumber(validEpisodes, 14)).toBeUndefined();
  });

  it("空配列に対して undefined を返す", () => {
    expect(getEpisodeByNumber([], 1)).toBeUndefined();
  });
});

// ---- hasCompleteEpisodeNumbers ----

describe("hasCompleteEpisodeNumbers", () => {
  it("1〜13の連番が揃っている場合は true を返す", () => {
    expect(hasCompleteEpisodeNumbers(validEpisodes)).toBe(true);
  });

  it("話数が13話未満の場合は false を返す", () => {
    expect(hasCompleteEpisodeNumbers(validEpisodes.slice(0, 12))).toBe(false);
  });

  it("話数の重複がある場合は false を返す", () => {
    const dup = [...validEpisodes.slice(0, 12), makeEpisode(1)];
    expect(hasCompleteEpisodeNumbers(dup)).toBe(false);
  });

  it("連番が飛んでいる場合は false を返す", () => {
    const gap = validEpisodes.map((ep, i) =>
      i === 6 ? { ...ep, number: 8 } : ep
    );
    expect(hasCompleteEpisodeNumbers(gap)).toBe(false);
  });

  it("順不同でも連番が揃っていれば true を返す", () => {
    const shuffled = [...validEpisodes].reverse();
    expect(hasCompleteEpisodeNumbers(shuffled)).toBe(true);
  });

  it("空配列は false を返す", () => {
    expect(hasCompleteEpisodeNumbers([])).toBe(false);
  });
});

// ---- EpisodeSchema（Zod 単体） ----

describe("EpisodeSchema", () => {
  it("有効なオブジェクトをパースできる", () => {
    const result = EpisodeSchema.parse(makeEpisode(1));
    expect(result.number).toBe(1);
  });

  it("number が浮動小数点の場合はZodエラーを投げる", () => {
    expect(() => EpisodeSchema.parse({ ...makeEpisode(1), number: 1.5 })).toThrow();
  });

  it("余分なフィールドは除去される", () => {
    const withExtra = { ...makeEpisode(1), extraField: "test" };
    const result = EpisodeSchema.parse(withExtra);
    expect((result as Record<string, unknown>).extraField).toBeUndefined();
  });
});

// ---- EpisodesSchema（13話配列） ----

describe("EpisodesSchema", () => {
  it("13話ちょうどでパースできる", () => {
    const result = EpisodesSchema.parse(validEpisodes);
    expect(result).toHaveLength(13);
  });

  it("12話ではエラーを投げる", () => {
    expect(() => EpisodesSchema.parse(validEpisodes.slice(0, 12))).toThrow();
  });

  it("14話ではエラーを投げる", () => {
    expect(() =>
      EpisodesSchema.parse([...validEpisodes, makeEpisode(14)])
    ).toThrow();
  });
});

// ---- buildStoryPrompt ----

describe("buildStoryPrompt", () => {
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

  it("プロンプトにペルソナの dominantType が含まれる", () => {
    const prompt = buildStoryPrompt(basePersona);
    expect(prompt).toContain("承認欲求型");
  });

  it("プロンプトに description が含まれる", () => {
    const prompt = buildStoryPrompt(basePersona);
    expect(prompt).toContain(basePersona.description);
  });

  it("プロンプトに7軸スコア（日本語ラベル）が含まれる", () => {
    const prompt = buildStoryPrompt(basePersona);
    expect(prompt).toContain("虚栄心");
    expect(prompt).toContain("嫉妬");
    expect(prompt).toContain("承認欲求");
    expect(prompt).toContain("孤独感");
    expect(prompt).toContain("野心");
    expect(prompt).toContain("不安");
    expect(prompt).toContain("愛情渇望");
  });

  it("JSON形式の指示が含まれる", () => {
    const prompt = buildStoryPrompt(basePersona);
    expect(prompt).toContain("JSON");
    expect(prompt).toContain("number");
    expect(prompt).toContain("title");
    expect(prompt).toContain("synopsis");
    expect(prompt).toContain("keyScene");
    expect(prompt).toContain("emotionalHook");
    expect(prompt).toContain("cliffhanger");
  });

  it("13話の指定が含まれる", () => {
    const prompt = buildStoryPrompt(basePersona);
    expect(prompt).toContain("13");
  });

  it("100文字以上の長さを持つ", () => {
    expect(buildStoryPrompt(basePersona).length).toBeGreaterThan(100);
  });
});
