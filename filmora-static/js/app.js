// 状態管理・イベントハンドラ・レンダリング

const AppState = {
  apiKey: localStorage.getItem('gemini_api_key') ?? '',
  ideas: [],
  selectedIdeaIds: new Set(),
  selectedFeatureIds: new Set(),
  manualMarkdown: '',
  isGenerating: false,
  activeCategory: 'all',
  featureSearch: '',
};

// ─────────────── 初期化 ───────────────
document.addEventListener('DOMContentLoaded', () => {
  restoreApiKey();
  renderFeatures();
  renderIdeas();
  updateGenerateButton();

  // イベント登録
  document.getElementById('apiKeyInput').addEventListener('input', onApiKeyInput);
  document.getElementById('toggleApiKey').addEventListener('click', toggleApiKeyVisibility);
  document.getElementById('fileInput').addEventListener('change', onFileChange);
  document.getElementById('featureSearch').addEventListener('input', onFeatureSearch);
  document.getElementById('generateBtn').addEventListener('click', onGenerate);
  document.getElementById('copyBtn').addEventListener('click', onCopy);
  document.getElementById('downloadBtn').addEventListener('click', onDownload);
  document.getElementById('selectAllFeatures').addEventListener('click', () => selectAllFeatures(true));
  document.getElementById('clearAllFeatures').addEventListener('click', () => selectAllFeatures(false));

  // カテゴリタブ
  document.getElementById('categoryTabs').addEventListener('click', e => {
    const btn = e.target.closest('[data-category]');
    if (!btn) return;
    AppState.activeCategory = btn.dataset.category;
    renderCategoryTabs();
    renderFeatures();
  });
});

// ─────────────── APIキー ───────────────
function restoreApiKey() {
  const input = document.getElementById('apiKeyInput');
  if (AppState.apiKey) {
    input.value = AppState.apiKey;
  }
}

function onApiKeyInput(e) {
  AppState.apiKey = e.target.value.trim();
  localStorage.setItem('gemini_api_key', AppState.apiKey);
  updateGenerateButton();
}

function toggleApiKeyVisibility() {
  const input = document.getElementById('apiKeyInput');
  const btn = document.getElementById('toggleApiKey');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

// ─────────────── ファイルアップロード ───────────────
function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  const container = document.getElementById('ideasContainer');
  container.innerHTML = `
    <div class="text-center py-10 text-violet-500">
      <span class="inline-block w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mb-3"></span>
      <p class="text-sm font-medium">AI がアイディアを解析中…</p>
    </div>`;

  const reader = new FileReader();
  reader.onload = async ev => {
    const markdown = ev.target.result;
    try {
      const { ideas } = await parseIdeasMarkdown(markdown, AppState.apiKey);
      AppState.ideas = ideas;
      AppState.selectedIdeaIds = new Set();
      renderIdeas();
      updateGenerateButton();
      document.getElementById('fileLabel').textContent = `📄 ${file.name}`;
    } catch (err) {
      AppState.ideas = [];
      AppState.selectedIdeaIds = new Set();
      updateGenerateButton();
      container.innerHTML = `
        <div class="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <span class="text-red-500 text-lg shrink-0">❌</span>
          <div>
            <p class="text-red-700 font-medium text-sm">読み込みエラー</p>
            <p class="text-red-600 text-xs mt-1">${escHtml(err.message)}</p>
          </div>
        </div>`;
    }
  };
  reader.readAsText(file, 'utf-8');
}

// ─────────────── アイディア描画 ───────────────
function renderIdeas() {
  const container = document.getElementById('ideasContainer');
  if (AppState.ideas.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-400">
        <p class="text-4xl mb-3">📂</p>
        <p class="text-sm">ideas_YYYYMMDD.md をアップロードしてください</p>
      </div>`;
    return;
  }

  container.innerHTML = AppState.ideas.map(idea => {
    const checked = AppState.selectedIdeaIds.has(idea.index);
    const formatLabel = idea.format === 'instagram-carousel'
      ? '📸 Instagram'
      : '🐦 X スレッド';
    return `
      <div class="idea-card rounded-lg border cursor-pointer select-none transition-all
                  ${checked ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'}"
           data-idea-index="${idea.index}" onclick="toggleIdea(${idea.index})">
        <div class="p-3 flex items-start gap-3">
          <input type="checkbox" class="mt-0.5 accent-violet-600 w-4 h-4 shrink-0"
                 ${checked ? 'checked' : ''} onclick="event.stopPropagation(); toggleIdea(${idea.index})">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="text-xs font-bold text-violet-700">${idea.genreNumber} ${idea.genreLabel}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">${formatLabel}</span>
            </div>
            <p class="text-sm font-semibold text-gray-800 leading-snug">${escHtml(idea.title)}</p>
            ${idea.essence ? `<p class="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">${escHtml(idea.essence)}</p>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  updateIdeaCount();
}

function toggleIdea(index) {
  if (AppState.selectedIdeaIds.has(index)) {
    AppState.selectedIdeaIds.delete(index);
  } else {
    AppState.selectedIdeaIds.add(index);
  }
  renderIdeas();
  updateGenerateButton();
}

function updateIdeaCount() {
  const el = document.getElementById('ideaCount');
  if (el) el.textContent = `${AppState.selectedIdeaIds.size} / ${AppState.ideas.length} 件選択中`;
}

// ─────────────── 機能描画 ───────────────
function renderCategoryTabs() {
  const tabs = document.getElementById('categoryTabs');
  tabs.querySelectorAll('[data-category]').forEach(btn => {
    const isActive = btn.dataset.category === AppState.activeCategory;
    btn.className = `px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border
      ${isActive
        ? 'bg-violet-600 text-white border-violet-600'
        : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`;
  });
}

function getFilteredFeatures() {
  let list = FILMORA_FEATURES;
  if (AppState.activeCategory !== 'all') {
    list = list.filter(f => f.category === AppState.activeCategory);
  }
  if (AppState.featureSearch.trim()) {
    const q = AppState.featureSearch.trim().toLowerCase();
    list = list.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q)
    );
  }
  return list;
}

function renderFeatures() {
  const container = document.getElementById('featuresContainer');
  const features = getFilteredFeatures();

  if (features.length === 0) {
    container.innerHTML = `<p class="text-center text-gray-400 text-sm py-8">該当する機能がありません</p>`;
    return;
  }

  container.innerHTML = features.map(f => {
    const checked = AppState.selectedFeatureIds.has(f.id);
    return `
      <div class="feature-card rounded-lg border cursor-pointer select-none transition-all
                  ${checked ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'}"
           data-feature-id="${f.id}" onclick="toggleFeature('${f.id}')">
        <div class="p-2.5 flex items-start gap-2.5">
          <input type="checkbox" class="mt-0.5 accent-violet-600 w-4 h-4 shrink-0"
                 ${checked ? 'checked' : ''} onclick="event.stopPropagation(); toggleFeature('${f.id}')">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800">${f.icon} ${escHtml(f.name)}</p>
            <p class="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">${escHtml(f.description)}</p>
          </div>
        </div>
      </div>`;
  }).join('');

  updateFeatureCount();
}

function toggleFeature(id) {
  if (AppState.selectedFeatureIds.has(id)) {
    AppState.selectedFeatureIds.delete(id);
  } else {
    AppState.selectedFeatureIds.add(id);
  }
  renderFeatures();
  updateGenerateButton();
}

function selectAllFeatures(select) {
  const features = getFilteredFeatures();
  features.forEach(f => {
    if (select) {
      AppState.selectedFeatureIds.add(f.id);
    } else {
      AppState.selectedFeatureIds.delete(f.id);
    }
  });
  renderFeatures();
  updateGenerateButton();
}

function onFeatureSearch(e) {
  AppState.featureSearch = e.target.value;
  renderFeatures();
}

function updateFeatureCount() {
  const el = document.getElementById('featureCount');
  if (el) el.textContent = `${AppState.selectedFeatureIds.size} 個選択中`;
}

// ─────────────── 生成ボタン制御 ───────────────
function updateGenerateButton() {
  const btn = document.getElementById('generateBtn');
  const summaryEl = document.getElementById('selectionSummary');
  const ideaCount = AppState.selectedIdeaIds.size;
  const featureCount = AppState.selectedFeatureIds.size;
  const hasKey = AppState.apiKey.length > 0;
  const canGenerate = hasKey && ideaCount > 0 && featureCount > 0 && !AppState.isGenerating;

  btn.disabled = !canGenerate;
  btn.className = `w-full py-3 rounded-xl font-bold text-sm transition-all ${
    canGenerate
      ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md hover:shadow-lg'
      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
  }`;

  if (summaryEl) {
    if (ideaCount > 0 && featureCount > 0) {
      summaryEl.textContent = `✅ ${ideaCount}件のアイディア × ${featureCount}個の機能を選択中`;
      summaryEl.className = 'text-sm text-center text-violet-700 font-medium mb-2';
    } else {
      const missing = [];
      if (!hasKey) missing.push('APIキー');
      if (ideaCount === 0) missing.push('アイディア');
      if (featureCount === 0) missing.push('機能');
      summaryEl.textContent = missing.length ? `${missing.join('・')}を選択してください` : '';
      summaryEl.className = 'text-sm text-center text-gray-400 mb-2';
    }
  }
}

// ─────────────── 生成処理 ───────────────
async function onGenerate() {
  if (AppState.isGenerating) return;

  const selectedIdeas = AppState.ideas.filter(i => AppState.selectedIdeaIds.has(i.index));
  const selectedFeatures = FILMORA_FEATURES.filter(f => AppState.selectedFeatureIds.has(f.id));

  if (!AppState.apiKey || selectedIdeas.length === 0 || selectedFeatures.length === 0) return;

  AppState.isGenerating = true;
  AppState.manualMarkdown = '';
  updateGenerateButton();

  const outputSection = document.getElementById('outputSection');
  const outputEl = document.getElementById('manualOutput');
  outputSection.classList.remove('hidden');
  outputEl.innerHTML = `<p class="text-violet-600 text-sm flex items-center gap-2">
    <span class="inline-block w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></span>
    マニュアルを生成しています…
  </p>`;

  // スクロール：デスクトップは outputEl 内、モバイルはページ全体
  function scrollToBottom() {
    if (window.innerWidth >= 1024) {
      outputEl.scrollTop = outputEl.scrollHeight;
    } else {
      outputEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }

  // スロットル：100ms ごとに最大1回だけ再描画
  let renderPending = false;
  function scheduleRender() {
    if (renderPending) return;
    renderPending = true;
    requestAnimationFrame(() => {
      outputEl.innerHTML = marked.parse(AppState.manualMarkdown);
      scrollToBottom();
      renderPending = false;
    });
  }

  const userPrompt = buildUserPrompt(selectedIdeas, selectedFeatures);
  outputEl.classList.add('streaming');

  try {
    for await (const chunk of streamGemini(AppState.apiKey, SYSTEM_PROMPT, userPrompt)) {
      AppState.manualMarkdown += chunk;
      scheduleRender();
    }
    // 最終レンダリング（ストリーム完了後に確定版を描画）
    outputEl.classList.remove('streaming');
    outputEl.innerHTML = marked.parse(AppState.manualMarkdown);
    scrollToBottom();
  } catch (err) {
    outputEl.classList.remove('streaming');
    outputEl.innerHTML = `
      <div class="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
        <span class="text-red-500 text-lg">❌</span>
        <div>
          <p class="text-red-700 font-medium text-sm">生成エラー</p>
          <p class="text-red-600 text-xs mt-1">${escHtml(err.message)}</p>
        </div>
      </div>`;
  } finally {
    AppState.isGenerating = false;
    updateGenerateButton();
    document.getElementById('copyBtn').classList.remove('hidden');
    document.getElementById('downloadBtn').classList.remove('hidden');
  }
}

// ─────────────── コピー & ダウンロード ───────────────
async function onCopy() {
  if (!AppState.manualMarkdown) return;
  try {
    await navigator.clipboard.writeText(AppState.manualMarkdown);
    const btn = document.getElementById('copyBtn');
    const original = btn.textContent;
    btn.textContent = '✅ コピー済み';
    setTimeout(() => { btn.textContent = original; }, 2000);
  } catch {
    alert('クリップボードへのコピーに失敗しました。');
  }
}

function onDownload() {
  if (!AppState.manualMarkdown) return;
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const blob = new Blob([AppState.manualMarkdown], { type: 'text/markdown; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `filmora-manual-${date}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────── ユーティリティ ───────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
