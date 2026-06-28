import questionary
from pathlib import Path
from questionary import Style

from rules import MediaType, Platform
from config import MEDIA_LABELS, PLATFORM_LABELS
from prompt_builder import UserInput
from saver import make_timestamped_path
import display

# questionary カスタムスタイル
_STYLE = Style([
    ("qmark",        "fg:#00bfff bold"),
    ("question",     "bold"),
    ("answer",       "fg:#00ff88 bold"),
    ("pointer",      "fg:#00bfff bold"),
    ("highlighted",  "fg:#00bfff bold"),
    ("selected",     "fg:#00ff88"),
    ("separator",    "fg:#6c6c6c"),
    ("instruction",  "fg:#6c6c6c"),
])


def run_interactive() -> tuple[UserInput, Path | None]:
    """対話ステップ1〜4を順に実行し、(UserInput, 保存先パスまたはNone) を返す。"""

    # Step 1: メディア種別の選択
    display.show_step(1, "メディア形式の選択")
    media_answer = questionary.select(
        "素材はどちらで作成しますか？",
        choices=[
            questionary.Choice(title=MEDIA_LABELS[MediaType.IMAGE], value=MediaType.IMAGE),
            questionary.Choice(title=MEDIA_LABELS[MediaType.VIDEO], value=MediaType.VIDEO),
        ],
        style=_STYLE,
    ).ask()

    if media_answer is None:
        raise KeyboardInterrupt

    # Step 2: 配信プラットフォームの選択
    display.show_step(2, "配信プラットフォームの選択")
    platform_answer = questionary.select(
        "どのプラットフォームで配信しますか？",
        choices=[
            questionary.Choice(title=PLATFORM_LABELS[p], value=p)
            for p in Platform
        ],
        style=_STYLE,
    ).ask()

    if platform_answer is None:
        raise KeyboardInterrupt

    # Step 3: アイデア・テーマのヒアリング
    display.show_step(3, "アイデア・テーマの入力")
    idea_answer = questionary.text(
        "作成したい素材のイメージや、テーマを簡単に教えてください。",
        instruction="（例：サイバーパンクな街並み、カフェで作業する風景）",
        validate=lambda v: True if v.strip() else "テーマを入力してください",
        style=_STYLE,
    ).ask()

    if idea_answer is None:
        raise KeyboardInterrupt

    user_input = UserInput(
        media_type=media_answer,
        platform=platform_answer,
        idea=idea_answer.strip(),
    )

    # Step 4: ファイル保存の確認
    display.show_step(4, "プロンプトの保存")
    save_answer = questionary.confirm(
        "生成したプロンプトを .txt ファイルとして保存しますか？",
        default=False,
        style=_STYLE,
    ).ask()

    if save_answer is None:
        raise KeyboardInterrupt

    save_path = make_timestamped_path() if save_answer else None
    return user_input, save_path
