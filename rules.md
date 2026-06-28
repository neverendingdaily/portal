# SNS Prompt CLI — 内部ロジック仕様書

このファイルは `rules.py` および `config.py` の設計根拠と、ビジネスルールの全詳細を記述します。  
Claude Code が本プロジェクトを参照する際はこのファイルを読んでください。

---

## 1. アスペクト比・構図ルール表

`rules.py` の `RULES` 辞書のキーは `(MediaType, Platform)` のタプルです。

| メディア種別 | プラットフォーム | アスペクト比 | 使用AIモデル | 構図の方針 |
|---|---|---|---|---|
| 動画（Video） | YouTubeショート | 9:16 | Veo 3.1 | 被写体は中央やや上。上下15%・右端15%はUI領域。下部1/3はテロップ用ネガティブスペース |
| 動画（Video） | Instagramリール | 9:16 | Veo 3.1 | 同上。暖色ライティング推奨 |
| 動画（Video） | TikTok | 9:16 | Veo 3.1 | 被写体は「中央から左寄り」。右端25%は完全に空ける（UIアイコンが大きい）。下部40%をネガティブスペースに |
| 画像（Image） | Instagramフィード | 4:5 | Nano Banana 2 | 被写体を中央に。上下に文字入れ余白を多めに取る |
| 画像（Image） | X（旧Twitter） | 16:9 | Nano Banana 2 | 横長。左右に文字入れスペース（シンプルな背景） |
| 画像（Image） | Pinterest | 2:3 | Nano Banana 2 | 縦長。被写体は上半分に集中させ、下半分をタイトル・図解用のネガティブスペースに |
| 画像（Image） | LinkedIn | 1:1 | Nano Banana 2 | 正方形。被写体は中央、四隅に均等な余白。インフォグラフィック後乗せ前提のクリーン背景 |

### UI セーフティゾーンの根拠

- **縦型動画（9:16）共通**: 上下15%は各プラットフォームのUIバー（プロフィール、再生ボタンなど）と干渉する。右端15%はリアクションボタン・フォローボタンと重なる。
- **TikTok 固有**: 右側アイコン群（いいね・コメント・シェア・プロフィール）が他プラットフォームより大きいため右端25%を確保。下部もテロップが多いため40%のネガティブスペースが必要。
- **下部テロップゾーン**: 視聴者の70%以上がテロップを重視するため、下部は常に余白を確保する（YouTube/IG: 1/3、TikTok: 40%）。

---

## 2. フォールバックロジック

定義された `(MediaType, Platform)` の組み合わせ以外（例: 画像×YouTubeショート）が入力された場合、`get_rule()` は以下の優先順で対応します:

```
1. RULES に完全一致のキーがあればそれを返す
2. 縦型プラットフォーム（YOUTUBE_SHORTS / INSTAGRAM_REELS / TIKTOK）の場合:
   - VIDEO → DEFAULT_VIDEO_VERTICAL (9:16)
   - IMAGE → DEFAULT_IMAGE_PORTRAIT (4:5)
3. その他:
   - VIDEO → DEFAULT_VIDEO_HORIZONTAL (16:9)
   - IMAGE → DEFAULT_IMAGE_WIDE (16:9)
```

フォールバック時の `composition_notes` には「汎用デフォルト設定」という前置きが含まれ、ユーザーが特定ルールが適用されなかったことを認識できます。

---

## 3. 英語プロンプトのテンプレート構造（6セグメント）

`prompt_builder.py` の `_build_english_prompt()` が以下の順で文字列を結合します:

```
セグメント1: "[アスペクト比] cinematic vertical video / high-quality digital image"
セグメント2: "{ユーザーのアイデア}（キーワードヒント補完あり）"
セグメント3: "{camera_phrases[0]}"  ← カメラアングル・フレーミング
セグメント4: "{lighting_phrases[0]}"  ← 照明設定
セグメント5: "{subject_position}, {negative_space}"  ← 被写体位置＋余白指示
セグメント6: "{style_tags}"  ← スタイル・品質タグ（カンマ区切り）
```

全セグメントをカンマ区切りで結合した1文が最終プロンプトになります。

### 実例（動画 × YouTubeショート × "サイバーパンクな街並み"）

```
[9:16] cinematic vertical video, サイバーパンクな街並み (cyberpunk neon-lit dystopian cityscape),
vertical cinematic framing 9:16, dramatic rim lighting,
main subject placed slightly above vertical center keeping the right 15% margin free of key elements,
lower third of frame reserved as clean negative space for subtitle overlay top and bottom 15% kept free of critical details,
photorealistic, high detail, cinematic color grade, 16mm film grain
```

---

## 4. キーワードヒント辞書（config.py）

ユーザーの日本語アイデア文字列をスキャンし、マッチしたキーワードの英語ヒントをセグメント2に括弧書きで追加します。

| 日本語キーワード | 英語補完ヒント |
|---|---|
| サイバーパンク | cyberpunk neon-lit dystopian cityscape |
| カフェ | cozy warm cafe interior |
| 夕焼け | golden hour sunset warm glow |
| 自然 | lush natural scenery organic textures |
| 都市 | urban cityscape modern architecture |
| ポートレート | professional portrait photography |
| 食べ物 | food photography appetizing plating |
| ファッション | fashion editorial high-end styling |
| レトロ | retro vintage film photography aesthetic |
| テクノロジー | technology futuristic digital interface |

（全リストは `config.py` の `IDEA_KEYWORD_HINTS` 辞書を参照）

---

## 5. 拡張方法

### 新しいプラットフォームを追加する

1. `rules.py` の `Platform` enum に新しい値を追加
2. `RULES` 辞書に `(MediaType.IMAGE, Platform.NEW_PLATFORM)` キーのエントリを追加
3. `config.py` の `PLATFORM_LABELS` に日本語ラベルを追加

**それだけです。** `app.py` / `interactive.py` は `Platform` enum と `PLATFORM_LABELS` を動的に読み込むため、変更不要。

### 新しいキーワードヒントを追加する

`config.py` の `IDEA_KEYWORD_HINTS` 辞書にキーと値を追加するだけです。

---

## 6. ファイル依存関係

```
app.py
  ├── config.py       ← MEDIA_CLI_MAP, PLATFORM_CLI_MAP
  ├── prompt_builder.py ← UserInput, build()
  │     ├── rules.py  ← get_rule(), RuleSpec
  │     └── config.py ← IDEA_KEYWORD_HINTS
  ├── display.py      ← show_welcome(), show_result()
  │     └── prompt_builder.py ← GeneratedResult
  └── interactive.py  ← run_interactive()
        ├── rules.py  ← MediaType, Platform
        ├── config.py ← MEDIA_LABELS, PLATFORM_LABELS
        ├── prompt_builder.py ← UserInput
        └── display.py ← show_step()
```
