import type { PersonaTraits, Episode } from "../types";

export function buildCreativePrompt(
  persona: PersonaTraits,
  episodes: Episode[]
): string {
  const episodeSummary = episodes
    .slice(0, 5)
    .map((ep) => `第${ep.number}話「${ep.title}」: ${ep.synopsis.slice(0, 80)}`)
    .join("\n");

  return `あなたはクリエイティブディレクターです。以下の韓ドラ風ストーリーとペルソナをもとに、Veo・Filmora・Canva向けのクリエイティブ設計書を生成してください。

【ペルソナ】
${persona.dominantType}: ${persona.description}

【ストーリー概要（第1〜5話）】
${episodeSummary}

以下のJSON形式で返してください。他のテキストは一切含めないでください。

{
  "veo": {
    "openingScenePrompt": "<オープニング映像プロンプト（英語、200字以内）>",
    "episodeHighlightPrompts": [
      "<第1話ハイライト映像プロンプト（英語、100字以内）>",
      "<第2話ハイライト映像プロンプト（英語、100字以内）>",
      "<第3話ハイライト映像プロンプト（英語、100字以内）>"
    ],
    "moodBoard": "<映像全体のムードボード説明（日本語、100字以内）>"
  },
  "filmora": {
    "timelineStructure": "<タイムライン構成（イントロ〜エンドまでの秒単位の構成、200字以内）>",
    "transitionStyle": "<推奨トランジションスタイル（50字以内）>",
    "colorGrading": "<カラーグレーディング指示（50字以内）>",
    "bgmMood": "<BGMムード・ジャンル（50字以内）>",
    "textOverlayGuide": "<テキストオーバーレイのデザイン指針（80字以内）>"
  },
  "canva": {
    "thumbnailBrief": "<サムネイルデザインブリーフ（100字以内）>",
    "colorPalette": ["#XXXXXX", "#XXXXXX", "#XXXXXX", "#XXXXXX", "#XXXXXX"],
    "fontPairing": "<フォントペアリング（日本語フォント + 英語フォント）>",
    "snsPostTemplates": [
      "<Instagram用テンプレート説明（80字以内）>",
      "<X（Twitter）用テンプレート説明（80字以内）>",
      "<Stories用テンプレート説明（80字以内）>"
    ],
    "coverDesignConcept": "<カバーデザインコンセプト（100字以内）>"
  }
}`;
}
