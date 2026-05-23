// Gemini API ストリーミングクライアント

async function* streamGemini(apiKey, systemPrompt, userPrompt) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `gemini-2.5-flash:streamGenerateContent?key=${encodeURIComponent(apiKey)}&alt=sse`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
    }),
  });

  if (!response.ok) {
    let errMsg = `Gemini API エラー: ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) errMsg += ` — ${errJson.error.message}`;
    } catch {}
    throw new Error(errMsg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // 最後の不完全行をバッファに戻す

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.slice(5).trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const text =
          parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) yield text;
      } catch {
        // パース失敗行は無視
      }
    }
  }

  // バッファ残分の処理
  if (buffer.trim().startsWith('data:')) {
    const jsonStr = buffer.trim().slice(5).trim();
    if (jsonStr && jsonStr !== '[DONE]') {
      try {
        const parsed = JSON.parse(jsonStr);
        const text =
          parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) yield text;
      } catch {}
    }
  }
}
