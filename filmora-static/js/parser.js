// ideas_YYYYMMDD.md パーサー（Gemini AI抽出方式）

async function parseIdeasMarkdown(markdown, apiKey) {
  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。ヘッダーのAPIキー欄に入力してから再度ファイルを選択してください。');
  }

  const prompt = `以下のMarkdownテキストはSNS投稿アイディアのメモです。
このテキストから投稿アイディアを最大6件抽出し、下記のJSONスキーマに従って返してください。

【JSONスキーマ】
{
  "date": "ファイル内に記載の日付をYYYYMMDD形式で（見つからなければ空文字）",
  "rawDate": "同日付をYYYY-MM-DD形式で（見つからなければ空文字）",
  "ideas": [
    {
      "index": 1,
      "genreNumber": "①〜⑥のいずれか（該当なければ空文字）",
      "genreLabel": "ジャンル・カテゴリ名",
      "title": "投稿テーマのタイトル",
      "format": "instagram-carousel または x-thread（Xスレッド・X投稿系ならx-thread、それ以外はinstagram-carousel）",
      "sources": ["参考にした情報源・掛け合わせ元の配列"],
      "essence": "切り口の核心・コンセプト（1〜2文）",
      "content": "投稿内容の抜粋（最大200文字）",
      "caption": "投稿キャプション（あれば最大300文字、なければ空文字）",
      "cta": "コピペ用指示文・行動喚起文（あれば最大300文字、なければ空文字）"
    }
  ]
}

【注意事項】
- フォーマットが多少崩れていても、意味を読み取って抽出してください
- 明確なアイディアとして読み取れるものだけ抽出し、説明文やメモ書きは無視してください
- 必ずJSONのみを返してください（前後に説明テキストを付けないこと）

【Markdownテキスト】
${markdown.slice(0, 8000)}`;

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    let errMsg = `Gemini APIエラー: ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) errMsg += ` — ${errJson.error.message}`;
    } catch {}
    throw new Error(errMsg);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Markdown記法・挨拶文が含まれる場合に { ... } 部分だけを抽出して再試行
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        throw new Error(
          'AIからのレスポンスをJSONとして解析できませんでした。\n\n' +
          '【抽出後テキスト（先頭500文字）】\n' + match[0].slice(0, 500) + '\n\n' +
          '【元テキスト（先頭500文字）】\n' + text.slice(0, 500)
        );
      }
    } else {
      throw new Error(
        'AIのレスポンスにJSON部分が見つかりませんでした。\n\n' +
        '【AIレスポンス生データ（先頭500文字）】\n' + text.slice(0, 500)
      );
    }
  }

  const ideas = (parsed.ideas ?? []).slice(0, 6).map((idea, i) => ({
    index: i + 1,
    genreNumber: idea.genreNumber ?? '',
    genreLabel: idea.genreLabel ?? '',
    title: idea.title ?? '',
    format: idea.format === 'x-thread' ? 'x-thread' : 'instagram-carousel',
    sources: Array.isArray(idea.sources) ? idea.sources : [],
    essence: idea.essence ?? '',
    content: idea.content ?? '',
    caption: idea.caption ?? '',
    cta: idea.cta ?? '',
  }));

  return {
    date: parsed.date ?? '',
    rawDate: parsed.rawDate ?? '',
    ideas,
  };
}
