# SNS Marketing Prompt Generator

**Nano Banana 2 / Veo 3.1** 向けのSNSマーケティング用プロンプトを、ターミナル上の対話形式で自動生成するPython CLIツールです。

配信プラットフォームごとに最適なアスペクト比・構図（セーフティゾーン）を自動で解決し、すぐにAI生成ツールへ貼り付けられる精緻な英語プロンプトを出力します。

---

## 特徴

- **対話モード** — 3ステップの質問に答えるだけでプロンプトが完成
- **ワンショットモード** — CLIフラグで全入力を一括指定し、スクリプトへの組み込みも可能
- **プロンプト保存機能** — `.txt` ファイルへの出力に対応（`-o` フラグ or 対話での選択）
- **プラットフォーム別の自動最適化** — アスペクト比・UIセーフティゾーン・構図を自動解決
- **キーワード補完** — 日本語テーマを英語プロンプトに自動拡張
- **外部API不要** — 完全ローカル動作、追加のAPIキー設定は不要

---

## 対応プラットフォームと仕様

| プラットフォーム | アスペクト比 | AIモデル | 構図の特徴 |
|---|---|---|---|
| YouTube Shorts | 9:16 | Veo 3.1 | 被写体は中央やや上。下部1/3をテロップ用余白に |
| Instagram Reels | 9:16 | Veo 3.1 | 同上。暖色ライティング推奨 |
| TikTok | 9:16 | Veo 3.1 | 被写体を中央から左寄りに。右端25%・下部40%を空ける |
| Instagram フィード | 4:5 | Nano Banana 2 | 被写体を中央に。上下に文字入れ余白を確保 |
| X（旧Twitter） | 16:9 | Nano Banana 2 | 横長。左右に文字入れスペースを確保 |
| Pinterest | 2:3 | Nano Banana 2 | 縦長。上半分に被写体、下半分をタイトル・図解用余白に |
| LinkedIn | 1:1 | Nano Banana 2 | 正方形。四隅に均等な余白、インフォグラフィック後乗せ前提 |

---

## インストール

Python 3.10 以上が必要です。

```bash
git clone https://github.com/your-username/sns-prompt-cli.git
cd sns-prompt-cli
pip install -r requirements.txt
```

---

## 使い方

### 対話モード（引数なしで起動）

```bash
python3 app.py
```

ターミナル上で3つの質問に順番に答えると、プロンプトが生成されます。最後に `.txt` ファイルへの保存を選択できます。

```
╭─────────────────────────────────────────────────╮
│  SNS Marketing Prompt Generator                 │
│  Nano Banana 2 / Veo 3.1 対応  |  対話モード    │
╰─────────────────────────────────────────────────╯

── Step 1  メディア形式の選択 ───────────────────
? 素材はどちらで作成しますか？
  ❯ 画像（Nano Banana 2用）
    動画（Veo 3.1用）

── Step 2  配信プラットフォームの選択 ──────────
? どのプラットフォームで配信しますか？
  ❯ YouTubeショート ...

── Step 3  アイデア・テーマの入力 ───────────────
? 作成したい素材のイメージや、テーマを簡単に教えてください。
  サイバーパンクな街並み

── Step 4  プロンプトの保存 ─────────────────────
? 生成したプロンプトを .txt ファイルとして保存しますか？ (y/N)
```

### ワンショットモード（全引数を指定）

```bash
# 動画 × YouTube Shorts
python3 app.py --media video --platform youtube_shorts --idea "サイバーパンクな街並み"

# 画像 × Instagram フィード
python3 app.py --media image --platform instagram_feed --idea "カフェで作業する風景"

# 画像 × Pinterest（ファイルにも保存）
python3 app.py --media image --platform pinterest --idea "北欧インテリアのリビングルーム" -o output.txt

# 画像 × LinkedIn
python3 app.py --media image --platform linkedin --idea "ビジネスミーティングの様子"
```

#### `--platform` に指定できる値

| 値 | プラットフォーム |
|---|---|
| `youtube_shorts` | YouTube Shorts |
| `instagram_reels` | Instagram Reels |
| `tiktok` | TikTok |
| `instagram_feed` | Instagram フィード |
| `x_twitter` | X（旧Twitter） |
| `pinterest` | Pinterest |
| `linkedin` | LinkedIn |
| `other` | その他（汎用デフォルト） |

### 出力例

```
╭─ ■ 決定した仕様 ───────────────────────────────────────────────╮
│  使用AIモデル  Veo 3.1                                          │
│  アスペクト比  9:16                                             │
│  構図の工夫    主要被写体は「中央やや上」に配置。上下15%・      │
│               右端15%はUI。下部1/3はテロップ用ネガティブスペース │
╰─────────────────────────────────────────────────────────────────╯

╭─ ■ 生成用プロンプト ───────────────────────────────────────────╮
│  [9:16] cinematic vertical video, サイバーパンクな街並み        │
│  (cyberpunk neon-lit dystopian cityscape),                      │
│  vertical cinematic framing 9:16, dramatic rim lighting, ...    │
╰─────────────────────────────────────────────────────────────────╯
```

### ファイル保存オプション

| 方法 | コマンド例 |
|---|---|
| ワンショット時にファイルへ保存 | `python3 app.py ... -o prompt_out.txt` |
| 対話モードで保存を選択 | Step 4 で `y` を入力 → `sns_prompt_YYYYMMDD_HHMMSS.txt` が自動生成 |

---

## ファイル構成

```
sns-prompt-cli/
├── app.py              # エントリーポイント（argparse + モード判定）
├── rules.py            # プラットフォーム別アスペクト比・構図ルール定義
├── config.py           # 日本語ラベル・CLIオプション・キーワードヒント辞書
├── prompt_builder.py   # プロンプト組み立てロジック（6セグメント構成）
├── interactive.py      # 対話フロー（questionary）
├── display.py          # ターミナル表示（rich）
├── saver.py            # ファイル保存ロジック
├── rules.md            # 内部ロジック仕様書（拡張ガイド含む）
├── requirements.txt    # 依存ライブラリ
└── .env.example        # 将来の拡張用テンプレート
```

---

## 拡張：新しいプラットフォームを追加する

`rules.py` と `config.py` の2ファイルを編集するだけで、新しいプラットフォームを追加できます。

**1. `rules.py` の `Platform` enum に追加**

```python
class Platform(Enum):
    ...
    THREADS = "threads"   # 追加
```

**2. `rules.py` の `RULES` 辞書に追加**

```python
(MediaType.IMAGE, Platform.THREADS): {
    "ai_model": "Nano Banana 2",
    "aspect_ratio": "1:1",
    "composition_notes": "...",
    ...
},
```

**3. `config.py` の `PLATFORM_LABELS` に追加**

```python
Platform.THREADS: "Threads",
```

`interactive.py` や `app.py` は変更不要です。

---

## 依存ライブラリ

| ライブラリ | 用途 |
|---|---|
| [rich](https://github.com/Textualize/rich) | ターミナルへのリッチな出力（パネル・カラー） |
| [questionary](https://github.com/tmbo/questionary) | 対話形式の入力プロンプト |
| [python-dotenv](https://github.com/theskumar/python-dotenv) | `.env` ファイルの読み込み |

---

## ライセンス

MIT License
