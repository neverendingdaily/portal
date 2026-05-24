// プロンプト構築ロジック（TypeScript版からの移植）

const SYSTEM_PROMPT = `あなたはFilmora Proの全機能に精通したプロの動画編集講師です。
SNS投稿アイディアと選択されたFilmora Pro機能をもとに、初心者でも実践できる詳細な動画編集マニュアルを日本語で生成してください。

【出力フォーマット（厳守）】
各アイディアに対して以下の構造でマニュアルを生成してください：

---

# [テーマタイトル] × Filmora Pro 編集マニュアル

## 概要
（動画の目的・ターゲット視聴者・完成イメージを3〜5行で説明）

## 素材準備チェックリスト
- [ ] （必要な素材・機材・ファイル形式等）

## 編集ステップ（タイムライン順）
### Step N: [使用機能名]を使った[処理名]
**操作手順**
1. （具体的な操作手順）
2. ...
**タイムコード目安**：00:00〜00:XX
**Tips**：（効果を高める実践的なアドバイス）

## エクスポート設定（プラットフォーム別）
| プラットフォーム | 解像度 | アスペクト比 | 推奨ビットレート |
|---|---|---|---|

## 完成チェックリスト
- [ ] （投稿前に確認すべき項目）

---

複数アイディアがある場合は「---」で区切って各アイディアのマニュアルを続けて出力してください。`;

const VIDEO_SPECS = {
  'instagram-carousel': '縦型動画 9:16（1080×1920px）、60秒以内、Instagram Reels/ストーリーズ最適化',
  'x-thread': '横型動画 16:9（1920×1080px）、30秒以内（またはYouTube Shorts用 9:16縦型）',
};

function buildUserPrompt(ideas, features) {
  const featuresSection = features
    .map(f => `### ${f.name}（${f.icon}）\n${f.description}\n操作手順：\n${f.operationSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`)
    .join('\n\n');

  const ideasSection = ideas
    .map(idea => {
      const spec = VIDEO_SPECS[idea.format] || '';
      return `### アイディア${idea.index}：${idea.title}
- ジャンル：${idea.genreNumber} ${idea.genreLabel}
- SNSフォーマット：${idea.format === 'instagram-carousel' ? 'Instagramカルーセル → ' : 'Xスレッド → '}${spec}
- 掛け合わせ元：${idea.sources.join(' / ')}
- 切り口の核心：${idea.essence}
- 内容抜粋：${idea.content}
- 投稿指示文：${idea.cta}`;
    })
    .join('\n\n');

  return `## 使用するFilmora Pro機能（${features.length}件）

${featuresSection}

---

## 対象SNSアイディア（${ideas.length}件）

${ideasSection}

---

上記のアイディアと機能を組み合わせた動画編集マニュアルを生成してください。
各アイディアに対して、選択された${features.length}個の機能を適切なステップとして組み込んでください。`;
}
