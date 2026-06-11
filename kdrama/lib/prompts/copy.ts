import type { PersonaTraits } from "../types";

export function buildCopyPrompt(
  persona: PersonaTraits,
  productName: string
): string {
  return `あなたは日本トップクラスのセールスコピーライターです。以下のペルソナデータと商品・サービス名をもとに、このペルソナの深層心理に刺さるセールスコピーを生成してください。

【ペルソナデータ】
タイプ: ${persona.dominantType}
説明: ${persona.description}
虚栄心${persona.vanity}/嫉妬${persona.jealousy}/承認欲求${persona.approval}/孤独感${persona.loneliness}/野心${persona.ambition}/不安${persona.anxiety}/愛情渇望${persona.loveSeeking}

【商品・サービス名】
${productName}

以下のJSON形式で返してください。他のテキストは一切含めないでください。

{
  "headline": "<感情を揺さぶるキャッチコピー（30字以内）>",
  "subheadline": "<ヘッドラインを補強するサブコピー（50字以内）>",
  "painPoints": [
    "<このペルソナが抱える痛み1（40字以内）>",
    "<このペルソナが抱える痛み2（40字以内）>",
    "<このペルソナが抱える痛み3（40字以内）>"
  ],
  "promises": [
    "<商品が叶える約束1（40字以内）>",
    "<商品が叶える約束2（40字以内）>",
    "<商品が叶える約束3（40字以内）>"
  ],
  "cta": "<行動を促すCTA文（30字以内）>",
  "socialProof": "<社会的証明テンプレート文（80字以内）>",
  "emailSubjectLines": [
    "<メール件名案1（30字以内）>",
    "<メール件名案2（30字以内）>",
    "<メール件名案3（30字以内）>",
    "<メール件名案4（30字以内）>",
    "<メール件名案5（30字以内）>"
  ]
}`;
}
