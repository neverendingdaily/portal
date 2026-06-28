# sns-prompt-cli — Claude Code ガイダンス

SNSマーケティング用プロンプト生成CLIツール（2026-06-28 初期化）。  
ターミナル上でユーザーと対話し、Nano Banana 2 / Veo 3.1 向けの英語プロンプトと構図仕様を自動生成する。  
外部AIは一切使用しない（テンプレートベース生成）。

---

## コマンド

```bash
# セットアップ
cd 【Claude_Code_Output】/20260628_sns-prompt-cli
pip3 install -r requirements.txt

# 対話モード（引数なし）
python3 app.py

# ワンショットモード（全引数指定）
python3 app.py --media image --platform instagram_feed --idea "サイバーパンクな街並み"
python3 app.py --media video --platform youtube_shorts --idea "カフェで作業する風景"
python3 app.py --media image --platform x_twitter --idea "夕焼けの海岸線"

# ヘルプ
python3 app.py --help
```

---

## アーキテクチャ

```
app.py            エントリーポイント。argparse + モード判定 + 全体ワイヤリング
config.py         定数・日本語ラベル・CLIオプション名・キーワードヒント辞書
rules.py          MediaType/Platform enum、RuleSpec TypedDict、RULES辞書、get_rule()
prompt_builder.py UserInput / GeneratedResult dataclass、6セグメントプロンプト生成
interactive.py    questionary による3ステップ対話フロー
display.py        rich による画面表示（ウェルカムバナー・最終出力パネル）
rules.md          内部ロジック仕様書（このCLAUDE.mdからインポート）
```

@rules.md

---

## 技術スタック

| ライブラリ | バージョン | 用途 |
|---|---|---|
| rich | >=13.7.0 | パネル・色・Rule表示 |
| questionary | >=2.0.1 | インタラクティブ選択・テキスト入力 |
| python-dotenv | >=1.0.0 | .env 読込（将来拡張用） |
| argparse | stdlib | CLIフラグ解析 |

---

## 拡張ガイド

新しいプラットフォームを追加するには:
1. `rules.py` の `Platform` enum に値を追加
2. `RULES` 辞書に対応する `RuleSpec` エントリを追加
3. `config.py` の `PLATFORM_LABELS` に日本語ラベルを追加

詳細は `rules.md` を参照。
