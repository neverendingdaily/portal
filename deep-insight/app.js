// ── システムプロンプト ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `
[名前]：ディープ・インサイト解析士

あなたは「ディープ・インサイト解析士」です。
ユーザーが提示するキーワードについて、以下の観点から深く多角的に分析し、
構造化されたマークダウン形式で回答してください。

表面的な解説にとどまらず、本質・背景・未来像まで掘り下げることが求められます。
専門家でも唸るような鋭いインサイトを提供してください。

## 出力フォーマット

### 📊 概要
キーワードの基本的な定義・背景・現在の社会的位置づけを2〜3段落で説明する。

### 🔍 深層インサイト
表面的な情報の裏に潜む本質的な課題・矛盾・機会を3点挙げる。
各インサイトには「なぜそう言えるか」という根拠も添える。

### 📈 トレンド分析
現在のトレンドと今後3〜5年の動向予測。
業界・社会・テクノロジーの3軸から分析する。

### 💡 活用アイデア
ビジネス・個人・社会的な活用方法を3〜5案、具体的に提示する。
各アイデアにはターゲットとなる人物像も明記する。

### ⚠️ 注意点・リスク
知っておくべき落とし穴・反論・倫理的課題を3点挙げる。

### 🎯 アクション提案
今すぐ実行できる具体的な次のステップを3項目で示す。
（例：「〇〇について調べる」ではなく「〇〇のサービスに無料登録して△△を試す」レベルの具体性）

### 📣 SNS発信の注力ポイント
このキーワードでSNS（X・Instagram・TikTok・YouTubeなど）発信を行う際に特に意識すべきポイントを以下の観点で示す。
- **刺さる切り口**：どんな角度・問いかけ・体験談が反応を得やすいか
- **最適なフォーマット**：動画・画像・テキストスレッドなど媒体別の推奨形式
- **タイミングと文脈**：発信のタイミング（ニュース連動・季節性など）と文脈の作り方
- **バズりやすいフック**：冒頭・タイトル・サムネイルに使えるフレーズ例を2〜3個提示

#### 🎬 動画生成AI用プロンプト（Veo / Filmora対応）
このキーワードに関するSNS動画をVeoやFilmoraなどの動画生成AIで作成する際に、そのままコピペして使える英語プロンプトを2パターン提示する。
パターンごとに用途（ショート動画向け・解説動画向けなど）を1行で説明した後、以下のフォーマットでコードブロックに記述すること。

**パターン①（ショート動画・リール向け）**
\`\`\`
[Video generation prompt here — cinematic short-form style, vertical 9:16, vivid visuals matching the keyword theme, fast cuts, energetic music sync, text overlay hook in the first 2 seconds]
\`\`\`

**パターン②（解説・ストーリー動画向け）**
\`\`\`
[Video generation prompt here — documentary or explainer style, horizontal 16:9, smooth transitions, narrator-friendly pacing, keyword-related imagery with data visualization elements]
\`\`\`

上記の [ ] 内をキーワードの内容に合わせて具体的な英語プロンプトに書き換えて出力すること。プレースホルダーのまま出力しないこと。

### 🏆 競合の発信傾向分析
同じキーワードで発信している競合・インフルエンサー・メディアが取りがちなアプローチを分析し、差別化のヒントを示す。
- **多数派のアプローチ**：競合がよく使うトーン・切り口・見せ方のパターン
- **見落とされがちな視点**：競合が触れていない盲点や語られていない角度
- **差別化ポイント**：上記を踏まえて、埋もれずに目立つための発信戦略を具体的に提案する

---
出力は必ずマークダウン形式で。日本語で回答すること。
`;

// ── Gemini API 設定 ──────────────────────────────────────────────────
const GEMINI_MODEL   = "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const CORS_PROXY     = "https://api.allorigins.win/raw?url=";

function proxied(url) {
  return CORS_PROXY + encodeURIComponent(url);
}

// ── Firebase 設定（実際の値に差し替えてください）──────────────────────────
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID",
};

const FIREBASE_READY = !firebaseConfig.apiKey.startsWith("YOUR_");
let db = null;

if (FIREBASE_READY) {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
} else {
  console.info("[DeepInsight] Firebase は未設定です。履歴機能はオフになっています。");
}

// ── DOM 参照 ─────────────────────────────────────────────────────────────
const keywordInput     = document.getElementById("keywordInput");
const analyzeBtn       = document.getElementById("analyzeBtn");
const loading          = document.getElementById("loading");
const errorBox         = document.getElementById("errorBox");
const errorMsg         = document.getElementById("errorMsg");
const resultSection    = document.getElementById("resultSection");
const resultKeyword    = document.getElementById("resultKeyword");
const resultBody       = document.getElementById("resultBody");
const copyBtn          = document.getElementById("copyBtn");
const trendsTags       = document.getElementById("trendsTags");
const trendsRefresh    = document.getElementById("trendsRefresh");
const historyList      = document.getElementById("historyList");
const suggestInput     = document.getElementById("suggestInput");
const suggestBtn       = document.getElementById("suggestBtn");
const suggestPlatforms = document.getElementById("suggestPlatforms");
const suggestTags      = document.getElementById("suggestTags");
const settingsHeader   = document.getElementById("settingsHeader");
const settingsBody     = document.getElementById("settingsBody");
const settingsBadge    = document.getElementById("settingsBadge");
const apiKeyInput      = document.getElementById("apiKeyInput");
const apiKeySaveBtn    = document.getElementById("apiKeySaveBtn");
const apiKeyClearBtn   = document.getElementById("apiKeyClearBtn");

let lastMarkdown    = "";
let currentPlatform = "google";

// ── APIキー管理 ──────────────────────────────────────────────────────
function getApiKey() {
  return localStorage.getItem("gemini_api_key") || "";
}

function updateSettingsUI() {
  const hasKey = !!getApiKey();
  settingsBadge.textContent = hasKey ? "✅ 設定済み" : "⚠️ 未設定";
  settingsBadge.className   = "settings-badge " + (hasKey ? "saved" : "missing");
  settingsBody.hidden = hasKey;
  if (hasKey) apiKeyInput.value = "";
}

settingsHeader.addEventListener("click", () => {
  settingsBody.hidden = !settingsBody.hidden;
});

apiKeyInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") apiKeySaveBtn.click();
});

apiKeySaveBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key) { apiKeyInput.focus(); return; }
  localStorage.setItem("gemini_api_key", key);
  updateSettingsUI();
});

apiKeyClearBtn.addEventListener("click", () => {
  localStorage.removeItem("gemini_api_key");
  updateSettingsUI();
});

// ── Gemini API 直接呼び出し ──────────────────────────────────────────
async function callGeminiApi(keyword) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "Gemini APIキーが設定されていません。画面上部の ⚙️ 設定エリアからキーを入力してください。"
    );
  }

  const url  = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: keyword }] }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90000),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini API エラー (${res.status})`);
  }

  const parts = data.candidates?.[0]?.content?.parts || [];
  const text  = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join("");
  if (!text) throw new Error("Gemini API からの応答が空でした");
  return text;
}

// ── Firestore: キーワード保存 ─────────────────────────────────────────
async function saveKeyword(keyword) {
  if (!db) return;
  try {
    await db.collection("searchHistory").add({
      keyword,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.warn("[DeepInsight] 履歴の保存に失敗:", err.message);
  }
}

// ── Firestore: 履歴読み込み & 表示 ───────────────────────────────────
async function loadHistory() {
  if (!db) return;
  try {
    const snap = await db
      .collection("searchHistory")
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();

    if (snap.empty) {
      historyList.innerHTML = '<li class="history-empty">履歴がありません</li>';
      return;
    }

    historyList.innerHTML = "";
    for (const doc of snap.docs) {
      const { keyword, timestamp } = doc.data();
      const li = document.createElement("li");
      li.className = "history-item";

      const timeStr = timestamp
        ? new Date(timestamp.toMillis()).toLocaleString("ja-JP", {
            month: "numeric", day: "numeric",
            hour: "2-digit", minute: "2-digit",
          })
        : "";

      li.innerHTML = `
        <span class="history-item-keyword">${DOMPurify.sanitize(keyword)}</span>
        <span class="history-item-time">${timeStr}</span>`;
      li.addEventListener("click", () => {
        keywordInput.value = keyword;
        keywordInput.focus();
      });
      historyList.appendChild(li);
    }
  } catch (err) {
    console.warn("[DeepInsight] 履歴の読み込みに失敗:", err.message);
  }
}

// ── サジェスト検索 ────────────────────────────────────────────────────────
suggestPlatforms.addEventListener("click", (e) => {
  const btn = e.target.closest(".platform-btn");
  if (!btn) return;
  suggestPlatforms.querySelectorAll(".platform-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  currentPlatform = btn.dataset.platform;
  if (suggestInput.value.trim()) fetchSuggestions();
});

suggestInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") fetchSuggestions();
});
suggestBtn.addEventListener("click", fetchSuggestions);

async function fetchSuggestions() {
  const keyword = suggestInput.value.trim();
  if (!keyword) return;

  suggestTags.innerHTML = '<span class="suggest-loading">取得中...</span>';

  const q = encodeURIComponent(keyword);
  let apiUrl;
  switch (currentPlatform) {
    case "youtube":
      apiUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${q}&hl=ja`;
      break;
    case "duckduckgo":
      apiUrl = `https://duckduckgo.com/ac/?q=${q}&type=list`;
      break;
    case "bing":
      apiUrl = `https://api.bing.com/osjson.aspx?query=${q}&language=ja-JP`;
      break;
    default:
      apiUrl = `https://suggestqueries.google.com/complete/search?client=firefox&q=${q}&hl=ja`;
  }

  try {
    let data;
    try {
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error("direct failed");
      data = await res.json();
    } catch {
      const res = await fetch(proxied(apiUrl), { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error("proxy failed");
      data = await res.json();
    }

    const suggestions = Array.isArray(data[1]) ? data[1] : [];

    if (suggestions.length === 0) {
      suggestTags.innerHTML = '<span class="suggest-empty">サジェストが見つかりませんでした</span>';
      return;
    }

    suggestTags.innerHTML = "";
    for (const word of suggestions.slice(0, 10)) {
      const tag = document.createElement("button");
      tag.className = "suggest-tag";
      tag.textContent = word;
      tag.addEventListener("click", () => {
        keywordInput.value = word;
        keywordInput.focus();
      });
      suggestTags.appendChild(tag);
    }
  } catch {
    suggestTags.innerHTML = '<span class="suggest-empty">取得エラー</span>';
  }
}

// ── トレンドワード取得 ────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  "の", "に", "は", "を", "が", "で", "と", "も", "や", "な", "から", "へ",
  "より", "まで", "など", "について", "による", "として", "という",
  "する", "した", "して", "される", "れる", "なる", "ある", "いる", "れた",
  "された", "ため", "的", "者", "年", "月", "日", "時",
  "円", "万", "億", "人", "回", "件", "個", "台", "本", "社", "国", "市",
  "か", "、", "。", "・", "【", "】", "「", "」", "（", "）", "…", "―", "〜",
]);

function extractKeywords(titles) {
  const freq = {};
  for (const title of titles) {
    const tokens = title.match(/[一-龯々ぁ-ん゛゜ァ-ンヴー]{2,}/g) || [];
    for (const tok of tokens) {
      if (!STOP_WORDS.has(tok) && tok.length >= 2 && tok.length <= 10) {
        freq[tok] = (freq[tok] || 0) + 1;
      }
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));
}

const MOCK_TRENDS = [
  "生成AI", "円安", "インフルエンザ", "働き方改革", "脱炭素",
  "ChatGPT", "DX推進", "副業", "量子コンピュータ", "サステナブル",
  "メタバース", "物価高", "少子化", "再生可能エネルギー", "インバウンド",
];

function renderMockTrends() {
  trendsTags.innerHTML = "";
  for (const word of MOCK_TRENDS) {
    const tag = document.createElement("button");
    tag.className = "trend-tag";
    tag.textContent = word;
    tag.addEventListener("click", () => {
      keywordInput.value = word;
      keywordInput.focus();
    });
    trendsTags.appendChild(tag);
  }
}

async function loadTrends() {
  trendsTags.innerHTML = '<span class="trends-loading">読み込み中...</span>';
  try {
    const rssUrl = "https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja";
    const res = await fetch(proxied(rssUrl), { signal: AbortSignal.timeout(12000) });

    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);

    const xml = await res.text();
    const titleMatches = xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>/g);
    const titles = Array.from(titleMatches)
      .map((m) => {
        let t = m[1]
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
        t = t.replace(/\s[-－]\s[^\s].{1,30}$/, "").trim();
        return t;
      })
      .filter(Boolean);

    const words = extractKeywords(titles);
    if (words.length === 0) throw new Error("no keywords extracted");

    trendsTags.innerHTML = "";
    for (const { word } of words) {
      const tag = document.createElement("button");
      tag.className = "trend-tag";
      tag.textContent = word;
      tag.addEventListener("click", () => {
        keywordInput.value = word;
        keywordInput.focus();
      });
      trendsTags.appendChild(tag);
    }
  } catch (err) {
    console.error("[trends error]", err.message);
    renderMockTrends();
  }
}

// ── 解析実行 ──────────────────────────────────────────────────────────
async function runAnalysis() {
  const keyword = keywordInput.value.trim();
  if (!keyword) {
    keywordInput.focus();
    return;
  }

  setLoading(true);
  hideError();
  hideResult();

  try {
    const text = await callGeminiApi(keyword);
    lastMarkdown = text;
    renderResult(keyword, lastMarkdown);
    await saveKeyword(keyword);
    await loadHistory();
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

// ── UI ヘルパー ──────────────────────────────────────────────────────
function setLoading(on) {
  loading.hidden = !on;
  analyzeBtn.disabled = on;
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorBox.hidden = false;
}

function hideError() {
  errorBox.hidden = true;
}

function hideResult() {
  resultSection.hidden = true;
}

function renderResult(keyword, markdown) {
  resultKeyword.textContent = `「${keyword}」の解析結果`;
  const rawHtml = marked.parse(markdown);
  resultBody.innerHTML = DOMPurify.sanitize(rawHtml);
  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── コピーボタン ─────────────────────────────────────────────────────
copyBtn.addEventListener("click", async () => {
  if (!lastMarkdown) return;
  try {
    await navigator.clipboard.writeText(lastMarkdown);
    copyBtn.textContent = "✅ コピー完了";
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.textContent = "📋 コピー";
      copyBtn.classList.remove("copied");
    }, 2000);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = lastMarkdown;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
});

// ── イベントリスナー ─────────────────────────────────────────────────
analyzeBtn.addEventListener("click", runAnalysis);
keywordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runAnalysis();
});
trendsRefresh.addEventListener("click", loadTrends);

// ── 初期化 ──────────────────────────────────────────────────────────
updateSettingsUI();
loadTrends();
loadHistory();
