#!/usr/bin/env python3
"""SNS Marketing Prompt Generator — エントリーポイント."""

import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv

from config import MEDIA_CLI_CHOICES, PLATFORM_CLI_CHOICES, MEDIA_CLI_MAP, PLATFORM_CLI_MAP
from prompt_builder import UserInput, build
from saver import save_result
import display

load_dotenv()


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="app.py",
        description="SNSマーケティング用プロンプト生成ツール（Nano Banana 2 / Veo 3.1）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "使用例（ワンショットモード）:\n"
            "  python3 app.py --media image --platform instagram_feed --idea 'サイバーパンクな街並み'\n"
            "  python3 app.py --media video --platform youtube_shorts --idea 'カフェで作業する風景'\n\n"
            "引数なしで起動すると対話モードになります。"
        ),
    )
    parser.add_argument(
        "--media",
        choices=MEDIA_CLI_CHOICES,
        metavar=f"{{{','.join(MEDIA_CLI_CHOICES)}}}",
        help="メディア種別: image=画像（Nano Banana 2） / video=動画（Veo 3.1）",
    )
    parser.add_argument(
        "--platform",
        choices=PLATFORM_CLI_CHOICES,
        metavar=f"{{{','.join(PLATFORM_CLI_CHOICES)}}}",
        help="配信プラットフォーム",
    )
    parser.add_argument(
        "--idea",
        type=str,
        help='生成テーマ・アイデア（例: "サイバーパンクな街並み"）',
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        metavar="FILE",
        help="出力先ファイルパス（例: prompt_out.txt）。省略時はターミナルのみに表示。",
    )
    return parser


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    provided = [args.media, args.platform, args.idea]
    num_provided = sum(1 for v in provided if v is not None)

    save_path: Path | None = Path(args.output) if args.output else None

    if num_provided == 0:
        # ─── 対話モード ───
        display.show_welcome()
        try:
            import interactive
            user_input, interactive_save_path = interactive.run_interactive()
        except (KeyboardInterrupt, EOFError):
            display.console.print("\n[dim]中断しました。ワンショットモードでも実行できます:[/dim]")
            display.console.print(
                "[dim]  python3 app.py --media image --platform instagram_feed --idea 'テーマ'[/dim]\n"
            )
            sys.exit(0)
        # --output が明示指定されていない場合は対話での選択を使う
        if save_path is None:
            save_path = interactive_save_path

    elif num_provided == 3:
        # ─── ワンショットモード ───
        user_input = UserInput(
            media_type=MEDIA_CLI_MAP[args.media],
            platform=PLATFORM_CLI_MAP[args.platform],
            idea=args.idea.strip(),
        )

    else:
        # 一部だけ指定された場合はエラー
        missing = []
        if args.media is None:
            missing.append("--media")
        if args.platform is None:
            missing.append("--platform")
        if args.idea is None:
            missing.append("--idea")
        parser.error(
            f"--media / --platform / --idea はすべて同時に指定するか、すべて省略してください。\n"
            f"  未指定: {', '.join(missing)}"
        )
        return  # unreachable; satisfies type checker

    result = build(user_input)
    display.show_result(result)

    if save_path:
        save_result(result, save_path)
        display.show_saved(save_path)


if __name__ == "__main__":
    main()
