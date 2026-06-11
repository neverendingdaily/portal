export function buildPersonaPrompt(snsPostsText: string): string {
  return `あなたは深層心理分析の専門家です。以下のSNS投稿テキストを分析し、投稿者の心理特性を7軸でスコアリングしてください。

【SNS投稿テキスト】
${snsPostsText}

各軸を0〜10の整数でスコアリングし、以下のJSON形式で返してください。他のテキストは一切含めないでください。

{
  "vanity": <0-10>,
  "jealousy": <0-10>,
  "approval": <0-10>,
  "loneliness": <0-10>,
  "ambition": <0-10>,
  "anxiety": <0-10>,
  "loveSeeking": <0-10>,
  "dominantType": "<最も高いスコアの特性の日本語名称>型",
  "description": "<この人物の深層心理・行動パターン・欲求をドラマチックに表現した200字以内の人物描写>"
}

軸の定義：
- vanity（虚栄心）: 見栄・自己誇示・外見への執着度
- jealousy（嫉妬）: 他者への嫉妬・比較・羨望の強さ
- approval（承認欲求）: 他者からの評価・いいね・賞賛への渇望
- loneliness（孤独感）: 孤立感・疎外感・繋がりへの飢え
- ambition（野心）: 成功・上昇志向・支配欲の強さ
- anxiety（不安）: 将来への恐れ・不確実性への耐性の低さ
- loveSeeking（愛情渇望）: 愛情・受容・特別扱いへの欲求`;
}
