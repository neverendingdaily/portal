import type { PersonaTraits } from "../types";

export function buildStoryPrompt(persona: PersonaTraits): string {
  return `あなたは韓国ドラマの脚本家です。以下のペルソナデータをもとに、13話構成の韓ドラ風ラブストーリーを生成してください。

【ペルソナデータ】
タイプ: ${persona.dominantType}
説明: ${persona.description}
心理スコア: 虚栄心${persona.vanity}/嫉妬${persona.jealousy}/承認欲求${persona.approval}/孤独感${persona.loneliness}/野心${persona.ambition}/不安${persona.anxiety}/愛情渇望${persona.loveSeeking}

主人公はこのペルソナを持つ人物です。韓ドラ典型の展開（出会い→誤解→葛藤→危機→和解→ハッピーエンド）を踏まえつつ、ペルソナの深層欲求が各話のドラマを駆動するストーリーにしてください。

以下のJSON形式で13話分返してください。他のテキストは一切含めないでください。

[
  {
    "number": 1,
    "title": "<話タイトル>",
    "synopsis": "<あらすじ200字以内>",
    "keyScene": "<この話の見せ場シーン（50字以内）>",
    "emotionalHook": "<このペルソナの深層に刺さる感情フック（50字以内）>",
    "cliffhanger": "<次話への引き（最終話は感動のエンディングで締める）（50字以内）>"
  },
  ...
]`;
}
