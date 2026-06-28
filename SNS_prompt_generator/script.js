'use strict';

// ─── RULES: rules.py の RULES 辞書を完全移植 ─────────────────────────────
// キー形式: '${mediaType}:${platform}'

const RULES = {

  'video:youtube_shorts': {
    ai_model: 'Veo 3.1',
    aspect_ratio: '9:16',
    composition_notes: '主要被写体は「中央やや上」に配置。画面の上下15%および右端15%はUIが被るため、主要な被写体・テキストはその内側に収める。画面下部3分の1はテロップ挿入用のシンプルなネガティブスペース（ぼかし背景や単色）を確保。',
    camera_phrases: ['vertical cinematic framing 9:16', 'slightly low angle upward tilt'],
    lighting_phrases: ['dramatic rim lighting', 'cinematic ambient glow'],
    subject_position: 'main subject placed slightly above vertical center, keeping the right 15% margin free of key elements',
    negative_space: 'lower third of frame reserved as clean negative space for subtitle overlay, top and bottom 15% kept free of critical details',
    style_tags: ['photorealistic', 'high detail', 'cinematic color grade', '16mm film grain'],
  },

  'video:instagram_reels': {
    ai_model: 'Veo 3.1',
    aspect_ratio: '9:16',
    composition_notes: '主要被写体は「中央やや上」に配置。画面の上下15%および右端15%はUIが被るため注意。下部3分の1はテロップ・スタンプ用のシンプルな余白。暖色系ライティングでエンゲージメントを高める。',
    camera_phrases: ['vertical portrait framing 9:16', 'eye-level dynamic shot'],
    lighting_phrases: ['warm natural golden hour light', 'soft diffused backlight'],
    subject_position: 'subject positioned above center frame, right margin clear for Instagram UI',
    negative_space: 'lower third open with gradient fade background for text stickers and captions',
    style_tags: ['vibrant saturated colors', 'Instagram aesthetic', 'sharp focus on subject', 'smooth bokeh background'],
  },

  'video:tiktok': {
    ai_model: 'Veo 3.1',
    aspect_ratio: '9:16',
    composition_notes: '主要被写体は「中央から左寄り」に配置。TikTok UIは右側のアイコン群（いいね・コメント・シェア・プロフィール）が他プラットフォームより大きく存在感があるため、右端25%は完全に空ける。下部40%はテキスト・キャプション・CTA用のネガティブスペースとして確保する。',
    camera_phrases: ['vertical dynamic shot 9:16', 'energetic handheld-style framing slightly left of center'],
    lighting_phrases: ['bright even studio lighting', 'trendy neon accent lights'],
    subject_position: 'subject positioned center-left of frame, right 25% margin kept completely free for TikTok UI icons',
    negative_space: 'lower 40% of frame reserved as clean open space for captions, call-to-action text, and TikTok on-screen overlays',
    style_tags: ['vibrant high-contrast', 'trendy youth aesthetic', 'crisp sharp details', 'pop color palette'],
  },

  'image:instagram_feed': {
    ai_model: 'Nano Banana 2',
    aspect_ratio: '4:5',
    composition_notes: '被写体を画面中央に配置し、上下に文字入れができるよう背景の余白を多めに取る。上部はロゴ・テキストオーバーレイ用、下部はキャプションエリア用の余白を意識。背景はシンプルで清潔感のある構図にすること。',
    camera_phrases: ['portrait orientation 4:5 aspect ratio', 'medium close-up centered composition'],
    lighting_phrases: ['soft diffused natural light', 'even studio-quality lighting with gentle shadows'],
    subject_position: 'subject centered in frame with generous breathing room at top and bottom thirds',
    negative_space: 'visible clean background above subject for title text overlay, plain lower area suitable for caption or branding',
    style_tags: ['polished editorial quality', 'Instagram feed aesthetic', 'clean minimal composition', 'high-end commercial photography'],
  },

  'image:x_twitter': {
    ai_model: 'Nano Banana 2',
    aspect_ratio: '16:9',
    composition_notes: '横長構図で左右に文字入れスペースを確保。被写体を中央～左寄り配置にし、右側にシンプルな背景（文字重ね用）を残す。または1:1の正方形で被写体中央・四隅余白をテキスト用に活用する構成も有効。',
    camera_phrases: ['wide landscape framing 16:9', 'rule-of-thirds horizontal composition'],
    lighting_phrases: ['clean ambient light with minimal shadows', 'professional studio lighting setup'],
    subject_position: 'subject placed in left or center third of frame, right margin kept open with simple background',
    negative_space: 'right side of frame features minimal clean background for text placement, left and right margins both spacious',
    style_tags: ['clean minimal professional', 'high contrast sharp', 'corporate editorial style', 'muted neutral background'],
  },

  'image:pinterest': {
    ai_model: 'Nano Banana 2',
    aspect_ratio: '2:3',
    composition_notes: '縦長（2:3）構図で情報量を最大化。主要な被写体・ビジュアルは画面の上半分に配置し、視線を上から下へ誘導する。下半分はタイトル文字・説明文・図解を後乗せできるよう、シンプルな単色または淡いグラデーション背景のネガティブスペースを確保する。',
    camera_phrases: ['tall vertical portrait 2:3 aspect ratio', 'top-weighted composition with generous lower negative space'],
    lighting_phrases: ['bright airy natural light', 'soft lifestyle photography lighting'],
    subject_position: 'main subject placed in the upper half of the frame, visually anchored at top third with clear downward visual flow',
    negative_space: 'lower half of frame features simple clean background — plain color, soft gradient, or minimal texture — for title text, diagrams, or infographic overlay',
    style_tags: ['Pinterest aesthetic', 'bright airy lifestyle', 'high-end editorial', 'pastel or bold color palette', 'save-worthy visual design'],
  },

  'image:linkedin': {
    ai_model: 'Nano Banana 2',
    aspect_ratio: '1:1',
    composition_notes: 'ビジネス向けのクリーンでプロフェッショナルな正方形構図。被写体は中央に配置し、四隅に均等な余白を確保する。余白部分はインフォグラフィック・見出し・ブランドロゴを後乗せしやすいシンプルな背景（白・グレー・ブランドカラー）にすること。',
    camera_phrases: ['square format 1:1 aspect ratio', 'centered professional composition with equal margins'],
    lighting_phrases: ['clean professional studio lighting', 'even soft light with minimal harsh shadows'],
    subject_position: 'subject centered with balanced equal whitespace on all four sides, professional headroom maintained',
    negative_space: 'uniform margins on all sides suitable for infographic text, data overlays, or brand identity elements; background kept simple — white, light gray, or solid brand color',
    style_tags: ['professional corporate', 'clean minimal layout', 'business editorial', 'trustworthy color palette', 'LinkedIn feed optimized'],
  },
};

// ─── フォールバック用デフォルトルール ────────────────────────────────────

const VERTICAL_PLATFORMS = new Set([
  'youtube_shorts', 'instagram_reels', 'tiktok', 'pinterest'
]);

const DEFAULT_VIDEO_VERTICAL = {
  ai_model: 'Veo 3.1',
  aspect_ratio: '9:16',
  composition_notes: '汎用デフォルト設定（縦型動画）。主要被写体は中央やや上に配置。下部3分の1をテロップ用ネガティブスペースとして確保。',
  camera_phrases: ['vertical cinematic framing 9:16'],
  lighting_phrases: ['cinematic natural lighting'],
  subject_position: 'subject positioned slightly above center in vertical frame',
  negative_space: 'lower third reserved for text overlay',
  style_tags: ['photorealistic', 'cinematic', 'high detail'],
};

const DEFAULT_VIDEO_HORIZONTAL = {
  ai_model: 'Veo 3.1',
  aspect_ratio: '16:9',
  composition_notes: '汎用デフォルト設定（横型動画）。被写体は中央配置。左右に若干の余白を確保。',
  camera_phrases: ['wide cinematic framing 16:9'],
  lighting_phrases: ['cinematic ambient lighting'],
  subject_position: 'subject centered in wide frame',
  negative_space: 'lateral margins kept clean for potential text overlay',
  style_tags: ['photorealistic', 'cinematic', 'widescreen'],
};

const DEFAULT_IMAGE_PORTRAIT = {
  ai_model: 'Nano Banana 2',
  aspect_ratio: '4:5',
  composition_notes: '汎用デフォルト設定（縦型画像）。被写体を中央に。上下の余白を確保。',
  camera_phrases: ['portrait orientation 4:5'],
  lighting_phrases: ['soft natural light'],
  subject_position: 'subject centered with top and bottom breathing room',
  negative_space: 'top and bottom margins for text overlay',
  style_tags: ['polished', 'editorial', 'clean composition'],
};

const DEFAULT_IMAGE_WIDE = {
  ai_model: 'Nano Banana 2',
  aspect_ratio: '16:9',
  composition_notes: '汎用デフォルト設定（横型画像）。被写体は中央～左寄り。右側に余白を確保。',
  camera_phrases: ['wide landscape framing 16:9'],
  lighting_phrases: ['clean ambient light'],
  subject_position: 'subject placed left-center, right side open',
  negative_space: 'right side margin for text placement',
  style_tags: ['clean professional', 'high contrast', 'minimal'],
};

// ─── キーワードヒント辞書: config.py の IDEA_KEYWORD_HINTS を完全移植 ──────

const IDEA_KEYWORD_HINTS = {
  'サイバーパンク': 'cyberpunk neon-lit dystopian cityscape',
  'ネオン':         'neon-lit glowing atmosphere',
  'カフェ':         'cozy warm cafe interior',
  'コーヒー':       'coffee shop artisan atmosphere',
  '夕焼け':         'golden hour sunset warm glow',
  '夜景':           'city night lights bokeh',
  '自然':           'lush natural scenery organic textures',
  '森':             'dense forest dappled light',
  '海':             'ocean waves coastal scenery',
  '都市':           'urban cityscape modern architecture',
  'ポートレート':   'professional portrait photography',
  '人物':           'subject person human figure',
  '食べ物':         'food photography appetizing plating',
  '料理':           'culinary food styling close-up',
  '花':             'floral botanical arrangement',
  'ファッション':   'fashion editorial high-end styling',
  'スポーツ':       'dynamic sports action photography',
  '旅行':           'travel landscape destination photography',
  '抽象':           'abstract art geometric shapes',
  'ミニマル':       'minimalist clean negative space',
  'レトロ':         'retro vintage film photography aesthetic',
  'アニメ':         'anime illustration stylized 2D art',
  'イラスト':       'digital illustration detailed artwork',
  '水彩':           'watercolor soft artistic style',
  'ビジネス':       'professional business corporate photography',
  'テクノロジー':   'technology futuristic digital interface',
  '音楽':           'music concert live performance energy',
  'ペット':         'pet animal cute candid photography',
  '子供':           'children joyful candid lifestyle',
  '建築':           'architectural photography geometric structure',
};

// ─── コアロジック: rules.py の get_rule() を移植 ──────────────────────────

function getRule(mediaType, platform) {
  const key = `${mediaType}:${platform}`;
  if (RULES[key]) return RULES[key];

  const isVertical = VERTICAL_PLATFORMS.has(platform);
  if (mediaType === 'video') {
    return isVertical ? DEFAULT_VIDEO_VERTICAL : DEFAULT_VIDEO_HORIZONTAL;
  }
  return isVertical ? DEFAULT_IMAGE_PORTRAIT : DEFAULT_IMAGE_WIDE;
}

// ─── コアロジック: prompt_builder.py の _expand_idea() を移植 ─────────────

function expandIdea(idea) {
  const hints = [];
  for (const [keyword, hint] of Object.entries(IDEA_KEYWORD_HINTS)) {
    if (idea.includes(keyword)) hints.push(hint);
  }
  return hints.length > 0 ? `${idea} (${hints.join(', ')})` : idea;
}

// ─── コアロジック: prompt_builder.py の _build_english_prompt() を移植 ────

function buildPrompt(mediaType, platform, idea) {
  const rule = getRule(mediaType, platform);

  // 1. ベースの定義（より高品質な出力を促す表現に変更）
  const mediaDescriptor = mediaType === 'video'
    ? 'Breathtaking cinematic video sequence'
    : 'Award-winning masterpiece photography';
  const format = `[Aspect Ratio: ${rule.aspect_ratio}] ${mediaDescriptor}`;

  // 2. 主題とシーン
  const subject = expandIdea(idea);

  // 3. カメラと照明（配列の要素を全て結合）
  const camera = rule.camera_phrases.join(', ');
  const lighting = rule.lighting_phrases.join(', ');

  // 4. 構図（AIが無視しないよう、大文字で強調して指示）
  const composition = `COMPOSITION INSTRUCTIONS: ${rule.subject_position}. ${rule.negative_space}`;

  // 5. 品質とスタイル（最新AI向けの強力なクオリティブースターを追加）
  const style = rule.style_tags.join(', ');
  const qualityBooster = "8k resolution, ultra-detailed, photorealistic, masterpiece, highly intricate";

  // 改行を入れて、人間にもAIにも読みやすい構造的なプロンプトに結合
  return `${format}.\n\nSCENE: ${subject}.\nATMOSPHERE: ${lighting}, ${style}.\nCAMERA: ${camera}.\n\n${composition}\n\nQUALITY: ${qualityBooster}.`;
}

// ─── UI: アスペクト比ビジュアル ──────────────────────────────────────────

function renderRatioBox(ratioString) {
  const MAX_DIM = 80;
  const [wRaw, hRaw] = ratioString.split(':').map(Number);
  let boxW, boxH;
  if (wRaw >= hRaw) {
    boxW = MAX_DIM;
    boxH = Math.round((hRaw / wRaw) * MAX_DIM);
  } else {
    boxH = MAX_DIM;
    boxW = Math.round((wRaw / hRaw) * MAX_DIM);
  }
  const box = document.getElementById('ratio-box');
  box.style.width  = `${boxW}px`;
  box.style.height = `${boxH}px`;
  document.getElementById('ratio-label-display').textContent = ratioString;
}

// ─── UI: バリデーション ──────────────────────────────────────────────────

function showError(cardId, msgId, message) {
  document.getElementById(cardId).classList.add('has-error');
  document.getElementById(msgId).textContent = message;
}

function clearErrors() {
  ['step-1', 'step-2', 'step-3'].forEach(id => {
    document.getElementById(id).classList.remove('has-error');
  });
  ['error-media', 'error-platform', 'error-idea'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
}

// ─── UI: 生成メインハンドラ ──────────────────────────────────────────────

function generate() {
  clearErrors();

  const mediaEl    = document.querySelector('input[name="media-type"]:checked');
  const platformEl = document.getElementById('platform-select');
  const ideaEl     = document.getElementById('idea-input');

  const mediaType = mediaEl ? mediaEl.value : null;
  const platform  = platformEl.value || null;
  const idea      = ideaEl.value.trim();

  let hasError = false;
  if (!mediaType) {
    showError('step-1', 'error-media', 'メディア形式を選択してください');
    hasError = true;
  }
  if (!platform) {
    showError('step-2', 'error-platform', 'プラットフォームを選択してください');
    hasError = true;
  }
  if (!idea) {
    showError('step-3', 'error-idea', 'テーマ・アイデアを入力してください');
    hasError = true;
  }
  if (hasError) return;

  const rule   = getRule(mediaType, platform);
  const prompt = buildPrompt(mediaType, platform, idea);

  // textContent のみ使用（XSS対策）
  document.getElementById('spec-ai-model').textContent     = rule.ai_model;
  document.getElementById('spec-aspect-ratio').textContent  = rule.aspect_ratio;
  document.getElementById('spec-composition').textContent   = rule.composition_notes;
  document.getElementById('prompt-text').textContent        = prompt;

  renderRatioBox(rule.aspect_ratio);

  const outputSection = document.getElementById('output-section');
  if (outputSection.hasAttribute('hidden')) {
    outputSection.removeAttribute('hidden');
    void outputSection.offsetWidth; // reflow強制: hidden削除後にtransitionを発火させる
    outputSection.classList.add('visible');
  }

  outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // コピーボタンを未コピー状態にリセット
  const copyBtn = document.getElementById('copy-btn');
  copyBtn.textContent = 'コピー';
  copyBtn.classList.remove('copied');
}

// ─── UI: クリップボードコピー ─────────────────────────────────────────────

function execCommandFallback(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch (_) { /* silent */ }
  document.body.removeChild(ta);
}

function copyToClipboard() {
  const text = document.getElementById('prompt-text').textContent;
  const btn  = document.getElementById('copy-btn');

  function applyFeedback() {
    btn.textContent = 'Copied! ✓';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'コピー';
      btn.classList.remove('copied');
    }, 2000);
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(applyFeedback).catch(() => {
      execCommandFallback(text);
      applyFeedback();
    });
  } else {
    execCommandFallback(text);
    applyFeedback();
  }
}

// ─── イベントハンドラの登録 ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('generate-btn').addEventListener('click', generate);
  document.getElementById('copy-btn').addEventListener('click', copyToClipboard);

  // 各ステップのエラー状態を操作時にクリア
  document.getElementById('step-1').addEventListener('change', () => {
    document.getElementById('step-1').classList.remove('has-error');
    document.getElementById('error-media').textContent = '';
  });
  document.getElementById('platform-select').addEventListener('change', () => {
    document.getElementById('step-2').classList.remove('has-error');
    document.getElementById('error-platform').textContent = '';
  });
  document.getElementById('idea-input').addEventListener('input', () => {
    document.getElementById('step-3').classList.remove('has-error');
    document.getElementById('error-idea').textContent = '';
  });
});
