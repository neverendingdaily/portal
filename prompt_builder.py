from dataclasses import dataclass
from rules import MediaType, Platform, RuleSpec, get_rule
from config import IDEA_KEYWORD_HINTS


@dataclass
class UserInput:
    media_type: MediaType
    platform:   Platform
    idea:       str


@dataclass
class GeneratedResult:
    ai_model:          str
    aspect_ratio:      str
    composition_notes: str
    english_prompt:    str


def build(user_input: UserInput) -> GeneratedResult:
    rule = get_rule(user_input.media_type, user_input.platform)
    prompt = _build_english_prompt(user_input.idea, user_input.media_type, rule)
    return GeneratedResult(
        ai_model=rule["ai_model"],
        aspect_ratio=rule["aspect_ratio"],
        composition_notes=rule["composition_notes"],
        english_prompt=prompt,
    )


def _expand_idea(idea: str) -> str:
    """日本語キーワードを検出して英語ヒントを付加する。ヒットしなければそのまま返す。"""
    hints: list[str] = []
    for keyword, hint in IDEA_KEYWORD_HINTS.items():
        if keyword in idea:
            hints.append(hint)
    if hints:
        return f"{idea} ({', '.join(hints)})"
    return idea


def _build_english_prompt(idea: str, media_type: MediaType, rule: RuleSpec) -> str:
    """6セグメント構成で英語プロンプトを組み立てる。"""

    # セグメント1: アスペクト比 + メディア種別
    media_descriptor = (
        "cinematic vertical video"
        if media_type == MediaType.VIDEO
        else "high-quality digital image"
    )
    seg1 = f"[{rule['aspect_ratio']}] {media_descriptor}"

    # セグメント2: ユーザーアイデア（キーワード補完付き）
    seg2 = _expand_idea(idea)

    # セグメント3: カメラアングル・フレーミング
    seg3 = rule["camera_phrases"][0]

    # セグメント4: 照明
    seg4 = rule["lighting_phrases"][0]

    # セグメント5: 被写体配置 + ネガティブスペース
    seg5 = f"{rule['subject_position']}, {rule['negative_space']}"

    # セグメント6: スタイルタグ
    seg6 = ", ".join(rule["style_tags"])

    segments = [seg1, seg2, seg3, seg4, seg5, seg6]
    return ", ".join(segments)
