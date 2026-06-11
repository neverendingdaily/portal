import type { PersonaTraits, Episode, SalesCopy } from "../types";

export function buildCanvaPrompt(
  persona: PersonaTraits,
  episodes: Episode[],
  copy?: SalesCopy
): string {
  const headline = copy?.headline ?? "感動の韓ドラ体験";
  const subheadline = copy?.subheadline ?? "";
  const ep1Title = episodes[0]?.title ?? "出会いの予感";

  return `あなたはCanva Proのデザインディレクターです。以下の情報をもとに、4種のサムネイル構成案を生成してください。

【ペルソナ】
タイプ: ${persona.dominantType}
説明: ${persona.description}

【コピー】
ヘッドライン: ${headline}
サブ: ${subheadline}
第1話タイトル: 「${ep1Title}」

以下のJSON形式のみで返してください（他のテキストは不要）：

{
  "brandKit": {
    "colorPalette": ["#XXXXXX", "#XXXXXX", "#XXXXXX", "#XXXXXX", "#XXXXXX"],
    "fontPrimary": "<日本語フォント名>",
    "fontSecondary": "<英語フォント名>"
  },
  "thumbnails": [
    {
      "thumbnailId": "youtube",
      "label": "YouTube サムネイル",
      "format": "1280x720",
      "usage": "YouTube",
      "layout": {
        "backgroundType": "gradient",
        "backgroundColors": ["#XXXXXX", "#XXXXXX"],
        "mainImagePlacement": "right",
        "textAlignment": "left"
      },
      "layers": [
        {
          "layerId": "bg_gradient",
          "type": "gradient_overlay",
          "content": null,
          "style": { "opacity": 0.85 },
          "position": { "x": "0%", "y": "0%", "width": "100%", "height": "100%" }
        },
        {
          "layerId": "main_headline",
          "type": "text",
          "content": "<ヘッドラインテキスト（30字以内）>",
          "style": { "fontSize": 64, "fontFamily": "<フォント>", "color": "#FFFFFF", "bold": true },
          "position": { "x": "5%", "y": "20%", "width": "55%" }
        },
        {
          "layerId": "sub_text",
          "type": "text",
          "content": "<サブテキスト（20字以内）>",
          "style": { "fontSize": 32, "fontFamily": "<フォント>", "color": "#FFDDEE", "bold": false },
          "position": { "x": "5%", "y": "55%", "width": "55%" }
        },
        {
          "layerId": "character_image",
          "type": "image_placeholder",
          "content": "韓ドラ風 主人公 portrait",
          "style": null,
          "position": { "x": "55%", "y": "0%", "width": "45%", "height": "100%" }
        }
      ]
    },
    {
      "thumbnailId": "instagram_post",
      "label": "Instagram 投稿",
      "format": "1080x1080",
      "usage": "Instagram Post",
      "layout": {
        "backgroundType": "gradient",
        "backgroundColors": ["#XXXXXX", "#XXXXXX"],
        "mainImagePlacement": "full",
        "textAlignment": "center"
      },
      "layers": [
        ... (Instagram用レイヤー構成)
      ]
    },
    {
      "thumbnailId": "stories",
      "label": "Stories / Reels カバー",
      "format": "1080x1920",
      "usage": "Stories",
      "layout": {
        "backgroundType": "gradient",
        "backgroundColors": ["#XXXXXX", "#XXXXXX"],
        "mainImagePlacement": "center",
        "textAlignment": "center"
      },
      "layers": [
        ... (Stories用レイヤー構成)
      ]
    },
    {
      "thumbnailId": "twitter",
      "label": "Twitter/X OGP",
      "format": "1200x628",
      "usage": "Twitter/X",
      "layout": {
        "backgroundType": "solid",
        "backgroundColors": ["#XXXXXX"],
        "mainImagePlacement": "right",
        "textAlignment": "left"
      },
      "layers": [
        ... (Twitter用レイヤー構成)
      ]
    }
  ]
}

ルール：
- brandKit のカラーパレットは ${persona.dominantType} の心理特性に合うものを5色（HEXコード）
- fontPrimary は日本語フォント（例: Noto Serif JP, Hiragino Mincho Pro）
- fontSecondary は英語フォント（例: Playfair Display, Cormorant Garamond）
- 各サムネイルのレイヤーは最低4つ（背景・テキスト最低2つ・画像プレースホルダー）
- image_placeholder の content には Canva/Veo で使える画像検索キーワード（英語）
- Instagram Post と Stories の layers も YouTube と同様の詳細度で生成すること
- 必ず4種のサムネイル（youtube / instagram_post / stories / twitter）を生成`;
}
