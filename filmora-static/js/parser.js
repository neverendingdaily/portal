// AIレスポンスからJSONを安全に抽出・パースする関数
function parseJsonSafe(rawText) {
  // Markdownのコードブロック記号を除去
  const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  // 最初の { から最後の } までを抽出
  const match = cleaned.match(/\{[\s\S]*\}/);

  if (!match) {
    console.error('【parseJsonSafe】JSONが見つかりません。生レスポンス:', rawText);
    throw new Error(
      'AIのレスポンスにJSONが含まれていませんでした。\n' +
      'APIキーが正しいか、テキストに解析できる内容があるかご確認ください。'
    );
  }

  const jsonString = match[0];

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    const isTruncated = !jsonString.trimEnd().endsWith('}');
    console.error('【parseJsonSafe】JSONパース失敗。切断あり:', isTruncated, '\n抽出JSON:', jsonString);
    if (isTruncated) {
      throw new Error(
        'AIの返答がトークン上限で途中切断されました。\n' +
        '入力テキストを短くするか、アイディア数を減らしてから再試行してください。'
      );
    }
    throw new Error(
      'AIの返答をJSONとして解析できませんでした。\n' +
      '再試行しても解決しない場合は、入力テキストを変えてお試しください。'
    );
  }
}

async function parseIdeasMarkdown(markdown, apiKey) {
  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。ヘッダーのAPIキー欄に入力してから再度ファイルを選択してください。');
  }

  const prompt = `以下のテキストからSNS投稿アイディアを最大6件抽出し、下記のJSONスキーマ形式のみで返せ。
前置き・後書き・挨拶・コードブロック記号は一切禁止。JSONオブジェクトだけを出力すること。

【JSONスキーマ】
{
  "date": "テキスト内の日付をYYYYMMDD形式で（なければ空文字）",
  "rawDate": "同日付をYYYY-MM-DD形式で（なければ空文字）",
  "ideas": [
    {
      "index": 1,
      "genreNumber": "①〜⑥のような番号記号があれば（なければ空文字）",
      "genreLabel": "ジャンル・カテゴリ名",
      "title": "投稿テーマのタイトル（1文）",
      "format": "instagram-carousel または x-thread",
      "sources": ["参考情報・掛け合わせ元の配列（なければ空配列）"],
      "essence": "投稿の核心・ポイント（1〜2文、最大100文字）",
      "content": "投稿内容の抜粋（最大150文字）",
      "caption": "投稿キャプション（最大200文字、なければ空文字）",
      "cta": "行動喚起文（最大100文字、なければ空文字）"
    }
  ]
}

【テキスト】
${markdown.slice(0, 6000)}`;

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
        maxOutputTokens: 16384, // ← 4096だとJSONが途中で切れるため拡大（主犯バグ修正）
        thinkingConfig: { thinkingBudget: 0 }, // ← generationConfig の中に入れる（外はAPIエラー）
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

  // finishReason を確認してトークン切れを検出
  const finishReason = data?.candidates?.[0]?.finishReason ?? '';
  if (finishReason === 'MAX_TOKENS') {
    throw new Error(
      'AIの返答がトークン上限に達して途中で切断されました。\n' +
      '入力テキストを短くするか（目安3,000文字以内）、再試行してください。'
    );
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!text) {
    const reason = data?.candidates?.[0]?.finishReason ?? '不明';
    throw new Error('AIからの返答が空でした（finishReason: ' + reason + '）。再試行してください。');
  }

  console.log('【Gemini parseIdeasMarkdown】finishReason:', finishReason, '\n', text);

  const parsed = parseJsonSafe(text);

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
