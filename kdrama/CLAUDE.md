@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # 開発サーバー起動（ポート3000）
npm run build    # プロダクションビルド
npm run lint     # ESLint
```

## Architecture

Next.js 15 App Router + TypeScript。SNS投稿テキストを Claude API で分析し、ペルソナ（7軸心理スコア）→ 13話韓ドラストーリー → セールスコピー → Veo/Filmora/Canva設計書 を順次生成するパイプライン。

### データフロー

1. `app/page.tsx` — InputForm でSNS投稿と商品名を受け取る
2. `POST /api/analyze` — Claude API でペルソナ分析 → sessionId を発行し localStorage に保存
3. `app/result/[sessionId]/page.tsx` — ペルソナのレーダーチャートを表示、各生成ページへナビ
4. 各サブページ（story/copy/creative）で必要に応じて API を呼び出し、結果を localStorage に追記
5. `POST /api/notion/save` — セッション全体を Notion データベースページとして保存

### 重要ファイル

| ファイル | 役割 |
|---|---|
| `lib/types.ts` | `PersonaTraits`, `Episode`, `SalesCopy`, `CreativeOutput`, `Session` の型定義 |
| `lib/anthropic.ts` | Anthropic SDK クライアントと使用モデル定数 |
| `lib/notion.ts` | Notion API ラッパー（saveSessionToNotion） |
| `lib/prompts/*.ts` | 各生成フェーズのプロンプト構築関数 |
| `app/api/*/route.ts` | API ルート（analyze/story/copy/creative/notion/save） |

### 環境変数（.env.local）

```
ANTHROPIC_API_KEY=     # Anthropic API キー
NOTION_API_KEY=        # Notion Integration トークン
NOTION_DATABASE_ID=    # 保存先 Notion データベース ID
```

Notion データベースには `title` プロパティ（タイプ: Title）が必要。

### セッション管理

DB なし。localStorage のキー `session_{sessionId}` に `Session` オブジェクトを JSON 保存。各サブページが生成完了後に episodes/copy/creative を追記する。
