# 🎬 Filmora マニュアル生成ツール（静的版）

Filmora Pro の機能と SNS アイディアを組み合わせた動画編集マニュアルを Gemini API で自動生成する、ビルド不要の静的 Web アプリです。

## ファイル構成

```
20260523_filmora-static/
├── index.html          # メインアプリ（全 UI）
├── js/
│   ├── app.js          # 状態管理・イベントハンドラ・DOM 操作
│   ├── features.js     # Filmora Pro 40 機能データ
│   ├── parser.js       # ideas_YYYYMMDD.md パーサー
│   ├── prompts.js      # Gemini プロンプト構築
│   └── gemini.js       # Gemini API ストリーミングクライアント
└── README.md
```

## ローカルで起動

```bash
cd 20260523_filmora-static
python3 -m http.server 8080
# → http://localhost:8080/ をブラウザで開く
```

## 使い方

1. ヘッダー右上の「🔑 Gemini API キー」欄に API キーを入力（`localStorage` に自動保存）
2. 左パネルの「📂 .md ファイルを選択」で `ideas_YYYYMMDD.md` をアップロード
3. アイディアカードにチェックを入れて選択
4. 右パネルでカテゴリ・検索を使って Filmora 機能を選択
5. 「🎬 マニュアルを生成する」ボタンをクリック
6. ストリーミング表示されたマニュアルを「📋 コピー」または「⬇ .md 保存」

## GitHub Pages へのデプロイ

```bash
git init
git add .
git commit -m "initial commit"
gh repo create filmora-manual-static --public
git push -u origin main
# Settings → Pages → Source: main branch / root
```

## 技術スタック

| 項目 | 採用 |
|---|---|
| CSS | Tailwind CSS v3 CDN |
| Markdown 描画 | marked.js CDN |
| API 呼び出し | Gemini REST API（ブラウザ直接） |
| 状態管理 | グローバル `AppState` オブジェクト |
| ビルド | 不要 |
