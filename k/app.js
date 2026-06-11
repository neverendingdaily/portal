// ============================================================
// STORAGE
// ============================================================
const API_KEY_STORAGE_KEY = 'anthropic_api_key';
const SESSION_PREFIX = 'session_';

function getStoredApiKey() { return localStorage.getItem(API_KEY_STORAGE_KEY) || ''; }
function saveApiKey(key) { localStorage.setItem(API_KEY_STORAGE_KEY, key.trim()); }
function hasApiKey() { return !!getStoredApiKey(); }
function getSession(id) {
  const raw = localStorage.getItem(SESSION_PREFIX + id);
  return raw ? JSON.parse(raw) : null;
}
function saveSession(session) {
  localStorage.setItem(SESSION_PREFIX + session.id, JSON.stringify(session));
}

// ============================================================
// API CLIENT
// ============================================================
const MODEL = 'claude-sonnet-4-6';
const API_URL = 'https://api.anthropic.com/v1/messages';

async function callAnthropic(prompt, maxTokens) {
  const apiKey = getStoredApiKey();
  if (!apiKey) throw new Error('APIキーが設定されていません。画面上部でAnthropicのAPIキーを入力してください。');
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API呼び出しに失敗しました (${res.status})`);
  }
  const data = await res.json();
  const block = data.content?.[0];
  return block?.type === 'text' ? block.text : '';
}

function extractFirstJsonObject(text) {
  let depth = 0, start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) return text.slice(start, i + 1);
    }
  }
  return '';
}

function extractFirstJsonArray(text) {
  let depth = 0, start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '[') {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === ']') {
      depth--;
      if (depth === 0 && start !== -1) return text.slice(start, i + 1);
    }
  }
  return '';
}

// ============================================================
// PROMPTS
// ============================================================

function buildPersonaPrompt(snsPostsText) {
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

function buildStoryPrompt(persona) {
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

function buildCopyPrompt(persona, productName) {
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

function buildVeoPrompt(persona, episodes) {
  const episodeSummary = episodes
    .map(ep => `ep${ep.number}: 「${ep.title}」— ${ep.synopsis.slice(0, 60)}`)
    .join('\n');
  return `You are a cinematic director creating text-to-video prompts for Google Veo.
Generate 15 scene prompts for a Korean drama series based on the following persona and story.

【Persona】
Type: ${persona.dominantType}
Description: ${persona.description}

【Episodes Summary】
${episodeSummary}

Return ONLY valid JSON in this exact structure (no other text):

{
  "globalStyle": {
    "cinematicStyle": "<Korean wave cinematic style description>",
    "colorGrading": "<color grading style, e.g. 'Teal & orange, warm golden hour'>",
    "referenceFilms": ["<K-drama title 1>", "<K-drama title 2>", "<K-drama title 3>"]
  },
  "scenes": [
    {
      "sceneId": "opening",
      "label": "オープニング",
      "episodeRef": null,
      "prompt": "<English text-to-video prompt, 100-200 chars, vivid and cinematic>",
      "durationHint": "5-10s",
      "aspectRatio": "16:9",
      "cameraMotion": "<e.g. slow pan right, static close-up, tracking shot>",
      "moodKeywords": ["<mood1>", "<mood2>", "<mood3>"]
    },
    {
      "sceneId": "ep1",
      "label": "第1話ハイライト",
      "episodeRef": 1,
      "prompt": "<English prompt>",
      "durationHint": "5-8s",
      "aspectRatio": "16:9",
      "cameraMotion": "<camera motion>",
      "moodKeywords": ["<mood1>", "<mood2>"]
    },
    {
      "sceneId": "ending",
      "label": "エンディング",
      "episodeRef": null,
      "prompt": "<English prompt for ending credits scene>",
      "durationHint": "8-12s",
      "aspectRatio": "16:9",
      "cameraMotion": "slow zoom out",
      "moodKeywords": ["emotional", "bittersweet", "hopeful"]
    }
  ]
}

Rules:
- All prompts MUST be in English
- Each scene prompt should be vivid, specific, and 100-200 characters
- Reflect the persona's dominant trait (${persona.dominantType}) in emotional tone
- Scenes ep1-ep13 must have episodeRef set to the episode number (1-13)
- Generate exactly 15 scenes: opening + ep1-ep13 + ending`;
}

function buildFilmoraPrompt(persona, episodes) {
  const episodeSummary = episodes
    .map(ep => `第${ep.number}話「${ep.title}」: ${ep.synopsis.slice(0, 80)} / 感情フック: ${ep.emotionalHook}`)
    .join('\n');
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
    }
  ]
}

ルール：
- bgmTracks は必ず4本（bgm_main / bgm_emotional / bgm_tension / bgm_ending）
- cuts は各話2カット前後、合計 24〜28 カット
- 各話の最初のカットには textOverlay でタイトルを表示
- transition は話の雰囲気に合わせて fade/cut/dissolve/zoom から選択
- bgmTrackRef は最も合うトラックIDを指定
- videoSourceHint に対応する Veo sceneId を含める
- totalDurationSec は全カットの endTimeSec 最大値を記入`;
}

function buildCanvaPrompt(persona, episodes, copy) {
  const headline = copy?.headline ?? '感動の韓ドラ体験';
  const subheadline = copy?.subheadline ?? '';
  const ep1Title = episodes[0]?.title ?? '出会いの予感';
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
    { "thumbnailId": "instagram_post", "label": "Instagram 投稿", "format": "1080x1080", "usage": "Instagram Post", "layout": { "backgroundType": "gradient", "backgroundColors": ["#XXXXXX", "#XXXXXX"], "mainImagePlacement": "full", "textAlignment": "center" }, "layers": [] },
    { "thumbnailId": "stories", "label": "Stories / Reels カバー", "format": "1080x1920", "usage": "Stories", "layout": { "backgroundType": "gradient", "backgroundColors": ["#XXXXXX", "#XXXXXX"], "mainImagePlacement": "center", "textAlignment": "center" }, "layers": [] },
    { "thumbnailId": "twitter", "label": "Twitter/X OGP", "format": "1200x628", "usage": "Twitter/X", "layout": { "backgroundType": "solid", "backgroundColors": ["#XXXXXX"], "mainImagePlacement": "right", "textAlignment": "left" }, "layers": [] }
  ]
}

ルール：
- brandKit のカラーパレットは ${persona.dominantType} の心理特性に合うものを5色（HEXコード）
- fontPrimary は日本語フォント（例: Noto Serif JP, Hiragino Mincho Pro）
- fontSecondary は英語フォント（例: Playfair Display, Cormorant Garamond）
- 各サムネイルのレイヤーは最低4つ（背景・テキスト最低2つ・画像プレースホルダー）
- image_placeholder の content には Canva/Veo で使える画像検索キーワード（英語）
- Instagram Post と Stories と Twitter の layers も YouTube と同様の詳細度で生成すること
- 必ず4種のサムネイル（youtube / instagram_post / stories / twitter）を生成`;
}

function buildNanoBananaPrompt(persona, episodes) {
  const episodeSummary = episodes
    .map(ep => `ep${ep.number}: 「${ep.title}」— ${ep.synopsis.slice(0, 60)}`)
    .join('\n');
  return `You are a creative director generating text-to-video prompts for NaNoBanana AI video generator.
NaNoBanana uses a style-first format: specify visual style, subject, action, and environment clearly.

【Persona】
Type: ${persona.dominantType}
Description: ${persona.description}

【Episodes Summary】
${episodeSummary}

Return ONLY valid JSON in this exact structure (no other text):

{
  "globalStyle": {
    "style": "<primary visual style, e.g. 'live action cinematic k-drama'>",
    "colorPalette": ["#XXXXXX", "#XXXXXX", "#XXXXXX", "#XXXXXX", "#XXXXXX"]
  },
  "scenes": [
    {
      "sceneId": "opening",
      "label": "オープニング",
      "episodeRef": null,
      "prompt": "<English prompt: style + subject + action + environment, 80-150 chars>",
      "durationHint": "5-10s",
      "style": "cinematic k-drama, live action, warm film grain",
      "aspectRatio": "16:9",
      "fps": 24
    },
    {
      "sceneId": "ep1",
      "label": "第1話",
      "episodeRef": 1,
      "prompt": "<English prompt>",
      "durationHint": "5-8s",
      "style": "<scene-specific style>",
      "aspectRatio": "16:9",
      "fps": 24
    },
    {
      "sceneId": "ending",
      "label": "エンディング",
      "episodeRef": null,
      "prompt": "<English prompt for final scene>",
      "durationHint": "8-12s",
      "style": "cinematic, soft bokeh, golden hour",
      "aspectRatio": "16:9",
      "fps": 24
    }
  ]
}

Rules:
- All prompts MUST be in English
- NaNoBanana prompt format: [style], [subject], [action], [environment/lighting]
  Example: "cinematic k-drama, young woman in hanbok, standing alone in rain, soft neon bokeh"
- Reflect ${persona.dominantType} psychology in each scene's emotional atmosphere
- Generate exactly 15 scenes: opening + ep1-ep13 + ending
- fps should be 24 for all scenes (cinematic feel)`;
}

// ============================================================
// DATA EXTRACTION
// ============================================================

function extractPersonaFromText(text) {
  const jsonStr = extractFirstJsonObject(text);
  if (!jsonStr) throw new Error('レスポンスにJSONが含まれていません');
  const persona = JSON.parse(jsonStr);
  const traits = ['vanity', 'jealousy', 'approval', 'loneliness', 'ambition', 'anxiety', 'loveSeeking'];
  if (!traits.every(k => typeof persona[k] === 'number') || !persona.dominantType || !persona.description) {
    throw new Error('ペルソナデータの形式が不正です');
  }
  return persona;
}

function extractEpisodesFromText(text) {
  const jsonStr = extractFirstJsonArray(text);
  if (!jsonStr) throw new Error('レスポンスにJSON配列が含まれていません');
  const episodes = JSON.parse(jsonStr);
  if (!Array.isArray(episodes) || episodes.length !== 13) {
    throw new Error(`エピソード数が不正です（${Array.isArray(episodes) ? episodes.length : 'array以外'}）`);
  }
  return episodes;
}

function extractCopyFromText(text) {
  const jsonStr = extractFirstJsonObject(text);
  if (!jsonStr) throw new Error('レスポンスにJSONが含まれていません');
  const copy = JSON.parse(jsonStr);
  const required = ['headline', 'subheadline', 'painPoints', 'promises', 'cta', 'socialProof', 'emailSubjectLines'];
  if (!required.every(k => k in copy)) throw new Error('セールスコピーの形式が不正です');
  return copy;
}

// ============================================================
// API WRAPPERS
// ============================================================

async function analyzePersona(snsPostsText) {
  const text = await callAnthropic(buildPersonaPrompt(snsPostsText), 1024);
  return extractPersonaFromText(text);
}

async function generateStory(persona) {
  const text = await callAnthropic(buildStoryPrompt(persona), 4096);
  return extractEpisodesFromText(text);
}

async function generateCopy(persona, productName) {
  const text = await callAnthropic(buildCopyPrompt(persona, productName), 2048);
  return extractCopyFromText(text);
}

async function generateVeo(persona, episodes, sessionId) {
  const text = await callAnthropic(buildVeoPrompt(persona, episodes), 4096);
  const jsonStr = extractFirstJsonObject(text);
  if (!jsonStr) throw new Error('Veoプロンプト生成に失敗しました');
  const parsed = JSON.parse(jsonStr);
  return {
    tool: 'veo', sessionId, generatedAt: new Date().toISOString(),
    persona: { dominantType: persona.dominantType, description: persona.description },
    ...parsed,
  };
}

async function generateFilmora(persona, episodes, sessionId) {
  const text = await callAnthropic(buildFilmoraPrompt(persona, episodes), 6000);
  const jsonStr = extractFirstJsonObject(text);
  if (!jsonStr) throw new Error('Filmora絵コンテ生成に失敗しました');
  const parsed = JSON.parse(jsonStr);
  return { tool: 'filmora', sessionId, generatedAt: new Date().toISOString(), ...parsed };
}

async function generateCanva(persona, episodes, copy, sessionId) {
  const text = await callAnthropic(buildCanvaPrompt(persona, episodes, copy), 5000);
  const jsonStr = extractFirstJsonObject(text);
  if (!jsonStr) throw new Error('Canvaサムネイル生成に失敗しました');
  const parsed = JSON.parse(jsonStr);
  return { tool: 'canva', sessionId, generatedAt: new Date().toISOString(), ...parsed };
}

async function generateNanoBanana(persona, episodes, sessionId) {
  const text = await callAnthropic(buildNanoBananaPrompt(persona, episodes), 4096);
  const jsonStr = extractFirstJsonObject(text);
  if (!jsonStr) throw new Error('NaNoBananaプロンプト生成に失敗しました');
  const parsed = JSON.parse(jsonStr);
  return {
    tool: 'nanobanana', sessionId, generatedAt: new Date().toISOString(),
    persona: { dominantType: persona.dominantType, description: persona.description },
    ...parsed,
  };
}

// ============================================================
// ASSET EXPORT
// ============================================================

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadJson(data, filename) {
  triggerDownload(JSON.stringify(data, null, 2), filename, 'application/json');
}

function downloadMarkdown(md, filename) {
  triggerDownload(md, filename, 'text/markdown');
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function buildVeoMarkdown(output) {
  const date = output.generatedAt.split('T')[0];
  const lines = [
    `# Veo 映像プロンプト集`,
    `**ペルソナ:** ${output.persona.dominantType} | **生成日:** ${date}`,
    ``, `## グローバルスタイル`,
    `- **映像スタイル:** ${output.globalStyle.cinematicStyle}`,
    `- **カラーグレーディング:** ${output.globalStyle.colorGrading}`,
    `- **参考作品:** ${output.globalStyle.referenceFilms.join(', ')}`,
    ``, `---`, ``,
  ];
  for (const scene of output.scenes) {
    lines.push(`## ${scene.label}`);
    lines.push(`**ID:** \`${scene.sceneId}\` | **尺:** ${scene.durationHint} | **アスペクト:** ${scene.aspectRatio} | **カメラ:** ${scene.cameraMotion}`);
    lines.push(`>`, `> ${scene.prompt}`, `>`);
    lines.push(`**ムードキーワード:** ${scene.moodKeywords.join(', ')}`, ``);
  }
  return lines.join('\n');
}

function buildNanoBananaMarkdown(output) {
  const date = output.generatedAt.split('T')[0];
  const lines = [
    `# NaNoBanana 映像プロンプト集`,
    `**ペルソナ:** ${output.persona.dominantType} | **生成日:** ${date}`,
    ``, `## グローバルスタイル`,
    `- **スタイル:** ${output.globalStyle.style}`,
    `- **カラーパレット:** ${output.globalStyle.colorPalette.join(', ')}`,
    ``, `---`, ``,
  ];
  for (const scene of output.scenes) {
    lines.push(`## ${scene.label}`);
    lines.push(`**ID:** \`${scene.sceneId}\` | **尺:** ${scene.durationHint} | **FPS:** ${scene.fps} | **アスペクト:** ${scene.aspectRatio}`);
    lines.push(`**スタイル:** ${scene.style}`, `>`, `> ${scene.prompt}`, `>`, ``);
  }
  return lines.join('\n');
}

function buildFilmoraMarkdown(output) {
  const date = output.generatedAt.split('T')[0];
  const { projectSettings, bgmTracks, cuts } = output;
  const lines = [
    `# Filmora 絵コンテ`, `**生成日:** ${date}`, ``,
    `## プロジェクト設定`,
    `**解像度:** ${projectSettings.resolution} / **FPS:** ${projectSettings.fps} / **総尺:** ${projectSettings.totalDurationSec}秒`,
    ``, `---`, ``, `## BGMトラック`,
    `| トラックID | ラベル | ジャンル | ムード | BPM | 開始 | 終了 | FadeIn | FadeOut |`,
    `|---|---|---|---|---|---|---|---|---|`,
  ];
  for (const t of bgmTracks) {
    lines.push(`| ${t.trackId} | ${t.label} | ${t.genre} | ${t.mood} | ${t.bpm} | ${t.startTimeSec}s | ${t.endTimeSec}s | ${t.fadeInSec}s | ${t.fadeOutSec}s |`);
  }
  lines.push(``, `---`, ``, `## カット割り`, ``);
  for (const cut of cuts) {
    lines.push(`### ${cut.cutId} — 第${cut.episodeRef}話`);
    lines.push(`- **時間:** ${formatTime(cut.startTimeSec)} → ${formatTime(cut.endTimeSec)}`);
    lines.push(`- **シーン:** ${cut.sceneDescription}`);
    lines.push(`- **トランジション:** ${cut.transition}`);
    lines.push(`- **BGM:** ${cut.bgmTrackRef}`);
    lines.push(`- **映像素材ヒント:** ${cut.videoSourceHint}`);
    if (cut.textOverlay) {
      const ov = cut.textOverlay;
      lines.push(`- **テキストオーバーレイ:** 「${ov.text}」（${ov.style} / ${ov.positionX}-${ov.positionY} / ${ov.durationSec}秒 / ${ov.fontColor}）`);
    }
    lines.push(``);
  }
  return lines.join('\n');
}

function buildCanvaMarkdown(output) {
  const date = output.generatedAt.split('T')[0];
  const { brandKit, thumbnails } = output;
  const lines = [
    `# Canva Pro サムネイル構成案`, `**生成日:** ${date}`, ``,
    `## ブランドキット`,
    `- **カラーパレット:** ${brandKit.colorPalette.join(', ')}`,
    `- **プライマリフォント:** ${brandKit.fontPrimary}`,
    `- **セカンダリフォント:** ${brandKit.fontSecondary}`,
    ``, `---`, ``,
  ];
  for (const thumb of thumbnails) {
    lines.push(`## ${thumb.label}`, `**サイズ:** ${thumb.format} | **用途:** ${thumb.usage}`, ``);
    lines.push(`### レイアウト`);
    lines.push(`- **背景:** ${thumb.layout.backgroundType} (${thumb.layout.backgroundColors.join(', ')})`);
    lines.push(`- **画像配置:** ${thumb.layout.mainImagePlacement}`, `- **テキスト揃え:** ${thumb.layout.textAlignment}`, ``);
    lines.push(`### レイヤー構成`, `| レイヤーID | タイプ | 内容 | 位置 |`, `|---|---|---|---|`);
    for (const layer of (thumb.layers || [])) {
      const content = layer.content ?? '-';
      const pos = `x:${layer.position.x} y:${layer.position.y}`;
      lines.push(`| ${layer.layerId} | ${layer.type} | ${content} | ${pos} |`);
    }
    lines.push(``);
  }
  return lines.join('\n');
}

// ============================================================
// UI UTILITIES
// ============================================================

function showLoading(msg) {
  const overlay = document.getElementById('loading-overlay');
  const msgEl = document.getElementById('loading-msg');
  if (overlay) overlay.classList.remove('hidden');
  if (msgEl) msgEl.textContent = msg;
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
// RADAR CHART SVG
// ============================================================

const TRAIT_KEYS = ['vanity', 'jealousy', 'approval', 'loneliness', 'ambition', 'anxiety', 'loveSeeking'];
const TRAIT_LABELS_JP = ['虚栄心', '嫉妬', '承認欲求', '孤独感', '野心', '不安', '愛情渇望'];

function buildRadarChartSVG(persona) {
  const n = TRAIT_KEYS.length;
  const cx = 160, cy = 160, r = 100, labelR = 136;

  function ang(i) { return (2 * Math.PI * i / n) - Math.PI / 2; }
  function pt(i, radius) {
    const a = ang(i);
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  }

  let svg = `<svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:320px;margin:0 auto;display:block">`;

  // Grid polygons
  for (let lv = 1; lv <= 5; lv++) {
    const pts = TRAIT_KEYS.map((_, i) => { const [x, y] = pt(i, r * lv / 5); return `${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ');
    svg += `<polygon points="${pts}" class="radar-grid"/>`;
  }
  // Axes
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i, r);
    svg += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="radar-axis"/>`;
  }
  // Data polygon
  const dataPts = TRAIT_KEYS.map((key, i) => {
    const val = Math.max(0, Math.min(10, persona[key] ?? 0));
    const [x, y] = pt(i, r * val / 10);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  svg += `<polygon points="${dataPts}" class="radar-polygon"/>`;
  // Dots
  TRAIT_KEYS.forEach((key, i) => {
    const val = Math.max(0, Math.min(10, persona[key] ?? 0));
    const [x, y] = pt(i, r * val / 10);
    svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" class="radar-dot"/>`;
  });
  // Labels
  TRAIT_KEYS.forEach((key, i) => {
    const a = ang(i);
    const [lx, ly] = pt(i, labelR);
    let anchor = 'middle';
    let dy = 5;
    if (Math.cos(a) > 0.3) anchor = 'start';
    else if (Math.cos(a) < -0.3) anchor = 'end';
    if (Math.sin(a) < -0.4) dy = -4;
    else if (Math.sin(a) > 0.4) dy = 14;
    svg += `<text x="${lx.toFixed(1)}" y="${(ly + dy).toFixed(1)}" text-anchor="${anchor}" class="radar-label">${TRAIT_LABELS_JP[i]}</text>`;
  });

  svg += `</svg>`;
  return svg;
}

// ============================================================
// VIEW: HOME
// ============================================================

function buildApiKeySection() {
  const saved = hasApiKey();
  if (saved) {
    return `
      <div class="flex items-center justify-between text-sm bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl mb-6">
        <span class="font-medium">✓ Anthropic APIキー設定済み</span>
        <button type="button" onclick="showApiKeyEdit()" class="text-xs text-green-600 underline hover:text-green-800">変更</button>
      </div>`;
  }
  return `
    <div id="api-key-edit" class="space-y-2 mb-6">
      <label class="block text-sm font-medium text-gray-700">
        Anthropic APIキー
        <span class="text-gray-400 font-normal ml-2 text-xs">（localStorageに保存・サーバーには送信しません）</span>
      </label>
      <div class="flex gap-2">
        <input id="apiKeyInput" type="password" placeholder="sk-ant-..."
          class="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-mono"
          autocomplete="off" onkeydown="if(event.key==='Enter'){event.preventDefault();onSaveApiKey();}">
        <button type="button" onclick="onSaveApiKey()"
          class="px-4 py-3 bg-gray-800 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors">
          保存
        </button>
      </div>
    </div>`;
}

function renderHome() {
  document.getElementById('app').innerHTML = `
    <main class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div class="max-w-2xl mx-auto px-4 py-16">
        <div class="text-center mb-10">
          <h1 class="text-4xl font-extrabold gradient-text mb-3">韓ドラ・ペルソナ</h1>
          <p class="text-gray-500 text-base leading-relaxed">
            SNS投稿から深層心理を分析し、<br>
            13話の韓ドラ風ストーリーとセールスコピーを自動生成します。
          </p>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div id="api-key-section">${buildApiKeySection()}</div>
          <form onsubmit="onAnalyze(event)" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                SNS投稿テキスト
                <span class="text-gray-400 font-normal ml-2">（分析対象の投稿を貼り付けてください）</span>
              </label>
              <textarea id="snsPosts" required
                placeholder="例：&#10;最近また新しいブランドバッグ買っちゃった✨ 周りの反応が楽しみすぎる&#10;あの子、また海外旅行してる…いいなぁ私も行きたい&#10;フォロワー1000人突破！みんなありがとう、もっと増やしたい"
                class="w-full h-48 p-4 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                商品・サービス名
                <span class="text-gray-400 font-normal ml-2">（セールスコピーの対象）</span>
              </label>
              <input id="productName" type="text" required
                placeholder="例：オンラインビジネス講座、美容サプリ、コーチングプログラム"
                class="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm">
            </div>
            <div id="home-error" class="hidden text-red-500 text-sm bg-red-50 p-3 rounded-lg"></div>
            <button type="submit"
              class="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-lg">
              ペルソナを分析する
            </button>
          </form>
        </div>
      </div>
    </main>`;
}

function showApiKeyEdit() {
  const section = document.getElementById('api-key-section');
  if (!section) return;
  section.innerHTML = `
    <div id="api-key-edit" class="space-y-2 mb-6">
      <label class="block text-sm font-medium text-gray-700">
        Anthropic APIキー
        <span class="text-gray-400 font-normal ml-2 text-xs">（localStorageに保存・サーバーには送信しません）</span>
      </label>
      <div class="flex gap-2">
        <input id="apiKeyInput" type="password" value="${esc(getStoredApiKey())}"
          class="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-mono"
          autocomplete="off" onkeydown="if(event.key==='Enter'){event.preventDefault();onSaveApiKey();}">
        <button type="button" onclick="onSaveApiKey()"
          class="px-4 py-3 bg-gray-800 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors">
          保存
        </button>
      </div>
    </div>`;
  document.getElementById('apiKeyInput')?.focus();
}

// ============================================================
// VIEW: RESULT
// ============================================================

function renderResult(sessionId) {
  const session = getSession(sessionId);
  if (!session || !session.persona) { window.location.hash = '/'; return; }
  const { persona, productName } = session;

  const scoreGrid = TRAIT_KEYS.map((key, i) => `
    <div class="text-center bg-purple-50 rounded-lg p-2">
      <p class="text-xs text-gray-500">${TRAIT_LABELS_JP[i]}</p>
      <p class="text-lg font-bold text-purple-700">${persona[key]}</p>
    </div>`).join('');

  const storyStatus = session.episodes ? `生成済み（${session.episodes.length}話）` : '未生成';
  const copyStatus = session.copy ? '生成済み' : '未生成';
  const creativeStatus = session.assets ? '生成済み（Veo / Filmora / Canva）' : '未生成';

  document.getElementById('app').innerHTML = `
    <main class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div class="max-w-2xl mx-auto px-4 py-10">
        <a href="#/" class="text-sm text-gray-400 hover:text-gray-600 mb-6 block">← 新しい分析</a>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div class="mb-6">
            <div class="inline-block bg-purple-100 text-purple-700 text-sm font-bold px-4 py-1.5 rounded-full mb-3">
              ${esc(persona.dominantType)}
            </div>
            <h2 class="text-xl font-bold text-gray-800 mb-2">${esc(productName)}</h2>
            <p class="text-gray-600 text-sm leading-relaxed">${esc(persona.description)}</p>
          </div>
          <div id="radar-chart-container" class="w-full mb-4"></div>
          <div class="grid grid-cols-4 gap-2">${scoreGrid}</div>
        </div>
        <div class="grid grid-cols-1 gap-3">
          <a href="#/result/${sessionId}/story"
            class="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-5 hover:border-purple-300 hover:shadow-sm transition-all">
            <div>
              <p class="font-bold text-gray-800">13話ストーリー</p>
              <p class="text-sm text-gray-500 mt-0.5">${storyStatus}</p>
            </div>
            <span class="text-purple-400 text-xl">→</span>
          </a>
          <a href="#/result/${sessionId}/copy"
            class="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-5 hover:border-purple-300 hover:shadow-sm transition-all">
            <div>
              <p class="font-bold text-gray-800">セールスコピー</p>
              <p class="text-sm text-gray-500 mt-0.5">${copyStatus}</p>
            </div>
            <span class="text-purple-400 text-xl">→</span>
          </a>
          <a href="#/result/${sessionId}/creative"
            class="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-5 hover:border-purple-300 hover:shadow-sm transition-all">
            <div>
              <p class="font-bold text-gray-800">クリエイティブ設計書</p>
              <p class="text-sm text-gray-500 mt-0.5">${creativeStatus}</p>
            </div>
            <span class="text-purple-400 text-xl">→</span>
          </a>
        </div>
      </div>
    </main>`;

  const container = document.getElementById('radar-chart-container');
  if (container) container.innerHTML = buildRadarChartSVG(persona);
}

// ============================================================
// VIEW: STORY
// ============================================================

function renderStory(sessionId) {
  const session = getSession(sessionId);
  if (!session) { window.location.hash = '/'; return; }

  document.getElementById('app').innerHTML = `
    <main class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div class="max-w-2xl mx-auto px-4 py-10">
        <a href="#/result/${sessionId}" class="text-sm text-gray-400 hover:text-gray-600 mb-6 block">← ダッシュボードに戻る</a>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 class="text-xl font-bold text-gray-800 mb-1">13話ストーリー</h2>
          <p class="text-sm text-gray-500 mb-6">${esc(session.persona?.dominantType ?? '')} のペルソナが主人公の韓ドラ風ストーリー</p>
          <div id="story-content"></div>
        </div>
      </div>
    </main>`;
  renderStoryContent(sessionId);
}

function renderStoryContent(sessionId) {
  const session = getSession(sessionId);
  const container = document.getElementById('story-content');
  if (!container || !session) return;

  if (!session.episodes) {
    container.innerHTML = `
      <div class="text-center py-8">
        <div id="story-error" class="hidden text-red-500 text-sm mb-4"></div>
        <button onclick="onGenerateStory('${sessionId}')"
          class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
          ストーリーを生成する
        </button>
      </div>`;
    return;
  }

  const cards = session.episodes.map(ep => `
    <div class="border border-gray-200 rounded-xl p-5 hover:border-purple-300 transition-colors">
      <div class="flex items-center gap-3 mb-3">
        <span class="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">第${ep.number}話</span>
        <h3 class="font-bold text-gray-800">「${esc(ep.title)}」</h3>
      </div>
      <p class="text-sm text-gray-600 leading-relaxed mb-4">${esc(ep.synopsis)}</p>
      <div class="grid grid-cols-1 gap-2 text-xs">
        <div class="flex gap-2">
          <span class="text-pink-500 font-medium shrink-0">見せ場</span>
          <span class="text-gray-600">${esc(ep.keyScene)}</span>
        </div>
        <div class="flex gap-2">
          <span class="text-purple-500 font-medium shrink-0">感情フック</span>
          <span class="text-gray-600">${esc(ep.emotionalHook)}</span>
        </div>
        <div class="flex gap-2">
          <span class="text-indigo-500 font-medium shrink-0">${ep.number === 13 ? 'エンディング' : '次話へ'}</span>
          <span class="text-gray-600 italic">${esc(ep.cliffhanger)}</span>
        </div>
      </div>
    </div>`).join('');

  container.innerHTML = `
    <div class="space-y-4">
      ${cards}
      <div id="story-error" class="hidden text-red-500 text-sm"></div>
      <button id="story-regen-btn" onclick="onGenerateStory('${sessionId}')"
        class="w-full mt-4 py-3 border border-purple-200 text-purple-600 text-sm font-semibold rounded-xl hover:bg-purple-50 transition-colors">
        再生成する
      </button>
    </div>`;
}

// ============================================================
// VIEW: COPY
// ============================================================

function renderCopy(sessionId) {
  const session = getSession(sessionId);
  if (!session) { window.location.hash = '/'; return; }

  document.getElementById('app').innerHTML = `
    <main class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div class="max-w-2xl mx-auto px-4 py-10">
        <a href="#/result/${sessionId}" class="text-sm text-gray-400 hover:text-gray-600 mb-6 block">← ダッシュボードに戻る</a>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 class="text-xl font-bold text-gray-800 mb-1">セールスコピー</h2>
          <p class="text-sm text-gray-500 mb-6">${esc(session.productName)} × ${esc(session.persona?.dominantType ?? '')} 向けコピー</p>
          <div id="copy-content"></div>
        </div>
      </div>
    </main>`;
  renderCopyContent(sessionId);
}

function buildCopyItem(label, value) {
  return `
    <div class="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg">
      <div class="flex-1 min-w-0">
        <p class="text-xs font-medium text-gray-500 mb-1">${label}</p>
        <p class="text-sm text-gray-800">${esc(value)}</p>
      </div>
      <button onclick="onCopyText(this)" data-copy="${esc(value)}"
        class="shrink-0 text-xs text-purple-600 hover:text-purple-800 font-medium mt-1 whitespace-nowrap">
        コピー
      </button>
    </div>`;
}

function renderCopyContent(sessionId) {
  const session = getSession(sessionId);
  const container = document.getElementById('copy-content');
  if (!container || !session) return;

  if (!session.copy) {
    container.innerHTML = `
      <div class="text-center py-8">
        <div id="copy-error" class="hidden text-red-500 text-sm mb-4"></div>
        <button onclick="onGenerateCopy('${sessionId}')"
          class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
          コピーを生成する
        </button>
      </div>`;
    return;
  }

  const copy = session.copy;
  const painItems = (copy.painPoints || []).map((p, i) => buildCopyItem(`痛み ${i + 1}`, p)).join('');
  const promiseItems = (copy.promises || []).map((p, i) => buildCopyItem(`約束 ${i + 1}`, p)).join('');
  const emailItems = (copy.emailSubjectLines || []).map((s, i) => buildCopyItem(`件名 ${i + 1}`, s)).join('');

  container.innerHTML = `
    <div class="space-y-6">
      <div class="space-y-3">
        <h3 class="font-semibold text-gray-700">メインコピー</h3>
        ${buildCopyItem('ヘッドライン', copy.headline)}
        ${buildCopyItem('サブヘッドライン', copy.subheadline)}
        ${buildCopyItem('CTA', copy.cta)}
        ${buildCopyItem('社会的証明', copy.socialProof)}
      </div>
      <div>
        <h3 class="font-semibold text-gray-700 mb-3">ペインポイント（3つの痛み）</h3>
        <div class="space-y-2">${painItems}</div>
      </div>
      <div>
        <h3 class="font-semibold text-gray-700 mb-3">プロミス（3つの約束）</h3>
        <div class="space-y-2">${promiseItems}</div>
      </div>
      <div>
        <h3 class="font-semibold text-gray-700 mb-3">メール件名（5案）</h3>
        <div class="space-y-2">${emailItems}</div>
      </div>
      <div id="copy-error" class="hidden text-red-500 text-sm"></div>
      <button onclick="onGenerateCopy('${sessionId}')"
        class="w-full mt-6 py-3 border border-purple-200 text-purple-600 text-sm font-semibold rounded-xl hover:bg-purple-50 transition-colors">
        再生成する
      </button>
    </div>`;
}

// ============================================================
// VIEW: CREATIVE
// ============================================================

let currentCreativeTab = 'veo';
let creativeGenerating = {};
let creativeErrors = {};

const CREATIVE_TAB_LABELS = { veo: 'Veo', nanobanana: 'NaNoBanana', filmora: 'Filmora', canva: 'Canva' };

function renderCreative(sessionId) {
  const session = getSession(sessionId);
  if (!session) { window.location.hash = '/'; return; }
  creativeGenerating = {};
  creativeErrors = {};

  const noEpisodes = !session.episodes;
  const assets = session.assets || {};

  const tabBar = ['veo', 'nanobanana', 'filmora', 'canva'].map(t => {
    const active = t === currentCreativeTab;
    const cls = active
      ? 'creative-tab-btn px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 border-purple-600 text-purple-700'
      : 'creative-tab-btn px-4 py-2.5 text-sm font-semibold transition-colors text-gray-500 hover:text-gray-700';
    const dot = assets[t] ? '<span class="ml-1.5 w-2 h-2 bg-green-400 rounded-full inline-block"></span>' : '';
    return `<button data-tab="${t}" onclick="switchCreativeTab('${sessionId}','${t}')" class="${cls}">${CREATIVE_TAB_LABELS[t]}${dot}</button>`;
  }).join('');

  document.getElementById('app').innerHTML = `
    <main class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div class="max-w-2xl mx-auto px-4 py-10">
        <a href="#/result/${sessionId}" class="text-sm text-gray-400 hover:text-gray-600 mb-6 block">← ダッシュボードに戻る</a>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 class="text-xl font-bold text-gray-800 mb-1">クリエイティブ設計書</h2>
          <p class="text-sm text-gray-500 mb-1">Veo / NaNoBanana / Filmora / Canva — 各ツール用プロンプト・絵コンテ・サムネイル設計を生成</p>
          <p class="text-xs text-gray-400 mb-6">生成後はJSONとMarkdownでダウンロードできます</p>
          ${noEpisodes ? `<div class="bg-amber-50 text-amber-700 text-sm p-3 rounded-lg mb-6">設計書生成にはストーリーが必要です。先に「13話ストーリー」を生成してください。</div>` : ''}
          <div class="flex flex-wrap gap-1 border-b border-gray-200 mb-6">${tabBar}</div>
          <div id="creative-tab-content"></div>
        </div>
      </div>
    </main>`;
  renderCreativeTabContent(sessionId);
}

function switchCreativeTab(sessionId, tab) {
  currentCreativeTab = tab;
  document.querySelectorAll('.creative-tab-btn').forEach(btn => {
    const t = btn.dataset.tab;
    btn.className = t === tab
      ? 'creative-tab-btn px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 border-purple-600 text-purple-700'
      : 'creative-tab-btn px-4 py-2.5 text-sm font-semibold transition-colors text-gray-500 hover:text-gray-700';
  });
  renderCreativeTabContent(sessionId);
}

function renderCreativeTabContent(sessionId) {
  const session = getSession(sessionId);
  const container = document.getElementById('creative-tab-content');
  if (!container || !session) return;

  const tab = currentCreativeTab;
  const isGenerating = !!creativeGenerating[tab];
  const error = creativeErrors[tab];
  const asset = session.assets?.[tab];

  if (isGenerating) {
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="spinner mx-auto mb-4"></div>
        <p class="text-gray-500 text-sm">生成中...</p>
      </div>`;
    return;
  }

  let html = '';
  if (error) html += `<p class="text-red-500 text-sm mb-4">${esc(error)}</p>`;

  if (!asset) {
    const disabled = !session.episodes ? 'disabled' : '';
    html += `
      <div class="text-center py-8">
        <button onclick="onGenerateCreativeAsset('${sessionId}','${tab}')" ${disabled}
          class="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
          ${esc(CREATIVE_TAB_LABELS[tab])} を生成
        </button>
      </div>`;
  } else {
    html += buildAssetContent(sessionId, tab, asset);
  }

  container.innerHTML = html;
}

function buildDownloadBar(sessionId, tab) {
  return `
    <div class="flex gap-2 pt-4 border-t border-gray-100 mt-4">
      <button onclick="onDownloadJson('${sessionId}','${tab}')"
        class="flex-1 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors">
        JSON ダウンロード
      </button>
      <button onclick="onDownloadMarkdown('${sessionId}','${tab}')"
        class="flex-1 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
        Markdown ダウンロード
      </button>
    </div>`;
}

function buildFieldWithCopy(label, value) {
  return `
    <div class="bg-gray-50 rounded-lg p-3">
      <div class="flex justify-between items-start mb-1">
        <p class="text-xs font-medium text-gray-500">${label}</p>
        <button onclick="onCopyText(this)" data-copy="${esc(value)}"
          class="text-xs text-purple-600 hover:text-purple-800 font-medium shrink-0 ml-2">コピー</button>
      </div>
      <p class="text-sm text-gray-800 leading-relaxed">${esc(value)}</p>
    </div>`;
}

function buildAssetContent(sessionId, tab, asset) {
  if (tab === 'veo') {
    const scenes = (asset.scenes || []).map(scene => `
      <div class="bg-gray-50 rounded-lg p-3 text-sm">
        <div class="flex items-center gap-2 mb-1">
          <span class="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded">${esc(scene.label)}</span>
          <span class="text-xs text-gray-400">${esc(scene.durationHint)} / ${esc(scene.aspectRatio)} / ${esc(scene.cameraMotion)}</span>
        </div>
        <p class="text-gray-800 italic">"${esc(scene.prompt)}"</p>
        <p class="text-xs text-gray-400 mt-1">Keywords: ${esc((scene.moodKeywords || []).join(', '))}</p>
      </div>`).join('');
    return `
      <div class="space-y-3">
        <div class="text-xs text-gray-400 text-right">${asset.scenes?.length ?? 0}シーン生成済</div>
        ${buildFieldWithCopy('映像スタイル', asset.globalStyle?.cinematicStyle ?? '')}
        ${buildFieldWithCopy('カラーグレーディング', asset.globalStyle?.colorGrading ?? '')}
        ${buildFieldWithCopy('参考作品', (asset.globalStyle?.referenceFilms ?? []).join(', '))}
        <div>
          <p class="text-xs font-medium text-gray-500 mb-2">シーンプロンプト一覧</p>
          <div class="space-y-2 max-h-96 overflow-y-auto">${scenes}</div>
        </div>
        ${buildDownloadBar(sessionId, tab)}
      </div>`;
  }

  if (tab === 'nanobanana') {
    const swatches = (asset.globalStyle?.colorPalette || []).map(color => `
      <div class="text-center">
        <div class="w-10 h-10 rounded-lg border border-gray-200 mb-1" style="background-color:${esc(color)}"></div>
        <p class="text-xs text-gray-600">${esc(color)}</p>
      </div>`).join('');
    const scenes = (asset.scenes || []).map(scene => `
      <div class="bg-gray-50 rounded-lg p-3 text-sm">
        <div class="flex items-center gap-2 mb-1">
          <span class="bg-pink-100 text-pink-700 text-xs font-bold px-2 py-0.5 rounded">${esc(scene.label)}</span>
          <span class="text-xs text-gray-400">${esc(scene.durationHint)} / ${scene.fps}fps</span>
        </div>
        <p class="text-gray-800 italic">"${esc(scene.prompt)}"</p>
        <p class="text-xs text-gray-400 mt-1">Style: ${esc(scene.style)}</p>
      </div>`).join('');
    return `
      <div class="space-y-3">
        <div class="text-xs text-gray-400 text-right">${asset.scenes?.length ?? 0}シーン生成済</div>
        ${buildFieldWithCopy('グローバルスタイル', asset.globalStyle?.style ?? '')}
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs font-medium text-gray-500 mb-2">カラーパレット</p>
          <div class="flex gap-2">${swatches}</div>
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500 mb-2">シーンプロンプト</p>
          <div class="space-y-2 max-h-96 overflow-y-auto">${scenes}</div>
        </div>
        ${buildDownloadBar(sessionId, tab)}
      </div>`;
  }

  if (tab === 'filmora') {
    const bgmRows = (asset.bgmTracks || []).map(track => `
      <div class="bg-gray-50 rounded-lg p-3 text-sm">
        <div class="flex items-center gap-2 mb-1">
          <span class="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded">${esc(track.trackId)}</span>
          <span class="font-medium text-gray-700">${esc(track.label)}</span>
        </div>
        <p class="text-xs text-gray-500">${esc(track.genre)} / ${esc(track.mood)} / ${track.bpm}BPM / ${track.startTimeSec}s→${track.endTimeSec}s</p>
      </div>`).join('');
    const cutRows = (asset.cuts || []).map(cut => `
      <div class="bg-gray-50 rounded-lg p-3 text-sm">
        <div class="flex items-center gap-2 mb-1">
          <span class="bg-gray-200 text-gray-700 text-xs font-mono px-2 py-0.5 rounded">${esc(cut.cutId)}</span>
          <span class="text-xs text-gray-500">第${cut.episodeRef}話 / ${cut.startTimeSec}s→${cut.endTimeSec}s / ${esc(cut.transition)}</span>
        </div>
        <p class="text-gray-700">${esc(cut.sceneDescription)}</p>
        ${cut.textOverlay ? `<p class="text-xs text-purple-600 mt-1">テキスト: 「${esc(cut.textOverlay.text)}」</p>` : ''}
        <p class="text-xs text-gray-400 mt-1">BGM: ${esc(cut.bgmTrackRef)} / ${esc(cut.videoSourceHint)}</p>
      </div>`).join('');
    return `
      <div class="space-y-4">
        <div class="bg-purple-50 rounded-lg p-3 text-sm">
          <p class="font-medium text-purple-800">${esc(asset.projectSettings?.resolution ?? '')} / ${asset.projectSettings?.fps ?? ''}fps / 総尺 ${asset.projectSettings?.totalDurationSec ?? ''}秒</p>
          <p class="text-purple-600 text-xs mt-1">BGM ${asset.bgmTracks?.length ?? 0}本 / カット ${asset.cuts?.length ?? 0}カット</p>
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500 mb-2">BGMトラック</p>
          <div class="space-y-2">${bgmRows}</div>
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500 mb-2">カット割り（${asset.cuts?.length ?? 0}カット）</p>
          <div class="space-y-2 max-h-80 overflow-y-auto">${cutRows}</div>
        </div>
        ${buildDownloadBar(sessionId, tab)}
      </div>`;
  }

  if (tab === 'canva') {
    const swatches = (asset.brandKit?.colorPalette || []).map(color => `
      <div class="text-center">
        <div class="w-10 h-10 rounded-lg border border-gray-200 mb-1" style="background-color:${esc(color)}"></div>
        <p class="text-xs text-gray-600">${esc(color)}</p>
      </div>`).join('');
    const thumbCards = (asset.thumbnails || []).map(thumb => {
      const layerRows = (thumb.layers || []).map(layer => `
        <div class="flex items-center gap-2 text-xs text-gray-600">
          <span class="bg-gray-100 px-1.5 py-0.5 rounded font-mono">${esc(layer.type)}</span>
          <span>${esc(layer.content ?? layer.layerId)}</span>
          ${layer.style?.fontSize ? `<span class="text-gray-400">${layer.style.fontSize}px</span>` : ''}
          ${layer.style?.color ? `<span class="inline-block w-3 h-3 rounded-sm border border-gray-200" style="background-color:${esc(layer.style.color)}"></span>` : ''}
        </div>`).join('');
      return `
        <div class="border border-gray-200 rounded-xl p-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="bg-pink-100 text-pink-700 text-xs font-bold px-2 py-1 rounded">${esc(thumb.usage)}</span>
            <span class="text-sm font-medium text-gray-700">${esc(thumb.label)}</span>
            <span class="text-xs text-gray-400 ml-auto">${esc(thumb.format)}</span>
          </div>
          <p class="text-xs text-gray-500 mb-2">
            背景: ${esc(thumb.layout?.backgroundType)} (${esc((thumb.layout?.backgroundColors || []).join(', '))}) /
            画像: ${esc(thumb.layout?.mainImagePlacement)} / テキスト: ${esc(thumb.layout?.textAlignment)}
          </p>
          <div class="space-y-1">${layerRows}</div>
        </div>`;
    }).join('');
    return `
      <div class="space-y-4">
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs font-medium text-gray-500 mb-2">ブランドキット</p>
          <p class="text-sm text-gray-700 mb-2">${esc(asset.brandKit?.fontPrimary ?? '')} / ${esc(asset.brandKit?.fontSecondary ?? '')}</p>
          <div class="flex gap-2">${swatches}</div>
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500 mb-2">サムネイル構成（${asset.thumbnails?.length ?? 0}種）</p>
          <div class="space-y-3">${thumbCards}</div>
        </div>
        ${buildDownloadBar(sessionId, tab)}
      </div>`;
  }

  return '';
}

// ============================================================
// EVENT HANDLERS
// ============================================================

function onSaveApiKey() {
  const input = document.getElementById('apiKeyInput');
  if (!input) return;
  const key = input.value.trim();
  if (!key) return;
  saveApiKey(key);
  const section = document.getElementById('api-key-section');
  if (section) {
    section.innerHTML = `
      <div class="flex items-center justify-between text-sm bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl mb-6">
        <span class="font-medium">✓ Anthropic APIキー設定済み</span>
        <button type="button" onclick="showApiKeyEdit()" class="text-xs text-green-600 underline hover:text-green-800">変更</button>
      </div>`;
  }
}

async function onAnalyze(event) {
  event.preventDefault();
  const snsPosts = document.getElementById('snsPosts')?.value ?? '';
  const productName = document.getElementById('productName')?.value ?? '';
  const errorEl = document.getElementById('home-error');
  if (errorEl) errorEl.classList.add('hidden');

  showLoading('SNS投稿を分析中...');
  try {
    const persona = await analyzePersona(snsPosts);
    const sessionId = crypto.randomUUID();
    saveSession({ id: sessionId, createdAt: new Date().toISOString(), snsPostsText: snsPosts, productName, persona });
    hideLoading();
    window.location.hash = `/result/${sessionId}`;
  } catch (err) {
    hideLoading();
    if (errorEl) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    }
  }
}

async function onGenerateStory(sessionId) {
  const session = getSession(sessionId);
  if (!session?.persona) return;

  const btn = document.getElementById('story-regen-btn');
  const errorEl = document.getElementById('story-error');
  if (errorEl) errorEl.classList.add('hidden');

  const container = document.getElementById('story-content');
  if (container) {
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="spinner mx-auto mb-4"></div>
        <p class="text-gray-500 text-sm">ストーリーを生成中...</p>
      </div>`;
  }

  try {
    const episodes = await generateStory(session.persona);
    const updated = { ...session, episodes };
    saveSession(updated);
    renderStoryContent(sessionId);
  } catch (err) {
    if (container) {
      container.innerHTML = `
        <div class="text-center py-8">
          <p class="text-red-500 text-sm mb-4">${esc(err.message)}</p>
          <button onclick="onGenerateStory('${sessionId}')"
            class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:opacity-90">
            ${session.episodes ? '再生成する' : 'ストーリーを生成する'}
          </button>
        </div>`;
    }
  }
}

async function onGenerateCopy(sessionId) {
  const session = getSession(sessionId);
  if (!session?.persona) return;

  const container = document.getElementById('copy-content');
  if (container) {
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="spinner mx-auto mb-4"></div>
        <p class="text-gray-500 text-sm">コピーを生成中...</p>
      </div>`;
  }

  try {
    const copy = await generateCopy(session.persona, session.productName);
    const updated = { ...session, copy };
    saveSession(updated);
    renderCopyContent(sessionId);
  } catch (err) {
    if (container) {
      container.innerHTML = `
        <div class="text-center py-8">
          <p class="text-red-500 text-sm mb-4">${esc(err.message)}</p>
          <button onclick="onGenerateCopy('${sessionId}')"
            class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:opacity-90">
            ${session.copy ? '再生成する' : 'コピーを生成する'}
          </button>
        </div>`;
    }
  }
}

async function onGenerateCreativeAsset(sessionId, tool) {
  const session = getSession(sessionId);
  if (!session?.persona || !session?.episodes) {
    creativeErrors[tool] = '先にストーリーを生成してください';
    renderCreativeTabContent(sessionId);
    return;
  }

  creativeGenerating[tool] = true;
  creativeErrors[tool] = null;
  renderCreativeTabContent(sessionId);

  try {
    let asset;
    if (tool === 'veo') asset = await generateVeo(session.persona, session.episodes, sessionId);
    else if (tool === 'filmora') asset = await generateFilmora(session.persona, session.episodes, sessionId);
    else if (tool === 'canva') asset = await generateCanva(session.persona, session.episodes, session.copy, sessionId);
    else asset = await generateNanoBanana(session.persona, session.episodes, sessionId);

    const updated = { ...session, assets: { ...(session.assets ?? {}), [tool]: asset } };
    saveSession(updated);

    const tabBtn = document.querySelector(`[data-tab="${tool}"]`);
    if (tabBtn && !tabBtn.querySelector('span')) {
      const dot = document.createElement('span');
      dot.className = 'ml-1.5 w-2 h-2 bg-green-400 rounded-full inline-block';
      tabBtn.appendChild(dot);
    }
  } catch (err) {
    creativeErrors[tool] = err.message;
  }

  creativeGenerating[tool] = false;
  renderCreativeTabContent(sessionId);
}

function onDownloadJson(sessionId, tab) {
  const session = getSession(sessionId);
  const asset = session?.assets?.[tab];
  if (!asset) return;
  downloadJson(asset, `${tab}_${sessionId}.json`);
}

function onDownloadMarkdown(sessionId, tab) {
  const session = getSession(sessionId);
  const asset = session?.assets?.[tab];
  if (!asset) return;
  let md = '';
  if (tab === 'veo') md = buildVeoMarkdown(asset);
  else if (tab === 'nanobanana') md = buildNanoBananaMarkdown(asset);
  else if (tab === 'filmora') md = buildFilmoraMarkdown(asset);
  else if (tab === 'canva') md = buildCanvaMarkdown(asset);
  if (md) downloadMarkdown(md, `${tab}_${sessionId}.md`);
}

function onCopyText(btn) {
  const text = btn.dataset.copy ?? '';
  const orig = btn.textContent;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'コピー済';
    btn.classList.add('text-green-600');
    btn.classList.remove('text-purple-600');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('text-green-600');
      btn.classList.add('text-purple-600');
    }, 1500);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

// ============================================================
// ROUTER
// ============================================================

function handleRoute() {
  const hash = window.location.hash.slice(1) || '/';
  const parts = hash.split('/').filter(p => p !== '');

  if (parts.length === 0) {
    renderHome();
  } else if (parts[0] === 'result' && parts[1]) {
    const sessionId = parts[1];
    const subPage = parts[2];
    if (!subPage) renderResult(sessionId);
    else if (subPage === 'story') renderStory(sessionId);
    else if (subPage === 'copy') renderCopy(sessionId);
    else if (subPage === 'creative') renderCreative(sessionId);
    else renderResult(sessionId);
  } else {
    renderHome();
  }
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', handleRoute);
