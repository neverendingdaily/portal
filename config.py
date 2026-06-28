from pathlib import Path
from rules import MediaType, Platform

BASE_DIR = Path(__file__).parent

# ─── 日本語表示ラベル ─────────────────────────────────────────────

MEDIA_LABELS: dict[MediaType, str] = {
    MediaType.IMAGE: "画像（Nano Banana 2用）",
    MediaType.VIDEO: "動画（Veo 3.1用）",
}

PLATFORM_LABELS: dict[Platform, str] = {
    Platform.YOUTUBE_SHORTS:  "YouTubeショート",
    Platform.INSTAGRAM_REELS: "Instagramリール",
    Platform.TIKTOK:          "TikTok",
    Platform.INSTAGRAM_FEED:  "Instagramフィード",
    Platform.X_TWITTER:       "X（旧Twitter）",
    Platform.PINTEREST:       "Pinterest",
    Platform.LINKEDIN:        "LinkedIn",
    Platform.OTHER:           "その他",
}

# ─── CLI引数のオプション文字列（argparse用）──────────────────────

MEDIA_CLI_CHOICES: list[str] = [m.value for m in MediaType]

PLATFORM_CLI_CHOICES: list[str] = [p.value for p in Platform]

# CLI値 → enum へのマッピング
MEDIA_CLI_MAP: dict[str, MediaType] = {m.value: m for m in MediaType}
PLATFORM_CLI_MAP: dict[str, Platform] = {p.value: p for p in Platform}

# ─── キーワードヒント辞書（日本語キーワード → 英語補完）──────────
# idea文字列に含まれるキーワードを検出し、英語ヒントをプロンプトに追加する

IDEA_KEYWORD_HINTS: dict[str, str] = {
    "サイバーパンク": "cyberpunk neon-lit dystopian cityscape",
    "ネオン":         "neon-lit glowing atmosphere",
    "カフェ":         "cozy warm cafe interior",
    "コーヒー":       "coffee shop artisan atmosphere",
    "夕焼け":         "golden hour sunset warm glow",
    "夜景":           "city night lights bokeh",
    "自然":           "lush natural scenery organic textures",
    "森":             "dense forest dappled light",
    "海":             "ocean waves coastal scenery",
    "都市":           "urban cityscape modern architecture",
    "ポートレート":   "professional portrait photography",
    "人物":           "subject person human figure",
    "食べ物":         "food photography appetizing plating",
    "料理":           "culinary food styling close-up",
    "花":             "floral botanical arrangement",
    "ファッション":   "fashion editorial high-end styling",
    "スポーツ":       "dynamic sports action photography",
    "旅行":           "travel landscape destination photography",
    "抽象":           "abstract art geometric shapes",
    "ミニマル":       "minimalist clean negative space",
    "レトロ":         "retro vintage film photography aesthetic",
    "アニメ":         "anime illustration stylized 2D art",
    "イラスト":       "digital illustration detailed artwork",
    "水彩":           "watercolor soft artistic style",
    "ビジネス":       "professional business corporate photography",
    "テクノロジー":   "technology futuristic digital interface",
    "音楽":           "music concert live performance energy",
    "ペット":         "pet animal cute candid photography",
    "子供":           "children joyful candid lifestyle",
    "建築":           "architectural photography geometric structure",
}
