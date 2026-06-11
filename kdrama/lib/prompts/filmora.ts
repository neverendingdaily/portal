import type { PersonaTraits, Episode } from "../types";

export function buildFilmoraPrompt(persona: PersonaTraits, episodes: Episode[]): string {
  const episodeSummary = episodes
    .map(
      (ep) =>
        `第${ep.number}話「${ep.title}」: ${ep.synopsis.slice(0, 80)} / 感情フック: ${ep.emotionalHook}`
    )
    .join("\n");

  return `あなたはプロの映像編集ディレクターです。以下の韓ドラストーリーとペルソナをもとに、Filmora用の絵コンテデータ（カット割り＋BGM指定）を生成してください。

【ペルソナ】
タイプ: ${persona.dominantType}
説明: ${persona.description}

【エピソード一覧】
${episodeSummary}

以下のJSON形式のみで返してください（他のテキストは不要）：

{
  "projectSettings": {
    "resolution": "1920x1080",
    "fps": 30,
    "totalDurationSec": <全カットの合計秒数（整数）>
  },
  "bgmTracks": [
    {
      "trackId": "bgm_main",
      "label": "メインテーマ",
      "genre": "K-drama OST orchestral",
      "mood": "<例: nostalgic longing>",
      "bpm": <整数>,
      "startTimeSec": 0,
      "endTimeSec": <整数>,
      "fadeInSec": 2,
      "fadeOutSec": 3
    },
    {
      "trackId": "bgm_emotional",
      "label": "感動シーンBGM",
      "genre": "piano ballad",
      "mood": "<例: tearful reunion>",
      "bpm": <整数>,
      "startTimeSec": <整数>,
      "endTimeSec": <整数>,
      "fadeInSec": 2,
      "fadeOutSec": 2
    },
    {
      "trackId": "bgm_tension",
      "label": "緊張・葛藤BGM",
      "genre": "dramatic strings",
      "mood": "<例: rising tension>",
      "bpm": <整数>,
      "startTimeSec": <整数>,
      "endTimeSec": <整数>,
      "fadeInSec": 1,
      "fadeOutSec": 2
    },
    {
      "trackId": "bgm_ending",
      "label": "エンディングBGM",
      "genre": "emotional pop",
      "mood": "<例: hopeful resolution>",
      "bpm": <整数>,
      "startTimeSec": <整数>,
      "endTimeSec": <整数>,
      "fadeInSec": 2,
      "fadeOutSec": 5
    }
  ],
  "cuts": [
    {
      "cutId": "cut_001",
      "episodeRef": 1,
      "startTimeSec": 0,
      "endTimeSec": 7,
      "sceneDescription": "<シーン説明（日本語、60字以内）>",
      "transition": "fade",
      "textOverlay": {
        "text": "第1話「<タイトル>」",
        "style": "title",
        "positionX": "center",
        "positionY": "middle",
        "durationSec": 2,
        "fontColor": "#FFFFFF"
      },
      "bgmTrackRef": "bgm_main",
      "videoSourceHint": "Veo scene: ep1 / stock: <キーワード>"
    },
    ...各話2カットずつ、計26カット前後を生成...
  ]
}

ルール：
- bgmTracks は必ず4本（bgm_main / bgm_emotional / bgm_tension / bgm_ending）
- cuts は各話2カット前後、合計 24〜28 カット
- 各話の最初のカットには textOverlay でタイトルを表示
- transition は話の雰囲気に合わせて fade/cut/dissolve/zoom から選択
- bgmTrackRef は最も合うトラックIDを指定
- videoSourceHint に対応する Veo sceneId（例: "ep1"）を含める
- totalDurationSec は全カットの endTimeSec 最大値を記入`;
}
