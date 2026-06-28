from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.rule import Rule
from rich.text import Text
from prompt_builder import GeneratedResult

console = Console()


def show_welcome() -> None:
    """ウェルカムバナーを表示する。"""
    console.print()
    console.print(
        Panel(
            Text.assemble(
                ("SNS Marketing Prompt Generator\n", "bold cyan"),
                ("Nano Banana 2 / Veo 3.1 対応  |  対話モード", "dim"),
            ),
            border_style="cyan",
            padding=(0, 2),
        )
    )
    console.print()


def show_step(step_num: int, title: str) -> None:
    """ステップ番号とタイトルを区切り線付きで表示する。"""
    console.print(Rule(f"[bold blue]Step {step_num}[/bold blue]  {title}", style="blue"))


def show_result(result: GeneratedResult) -> None:
    """最終出力を2つのパネルで表示する。"""
    console.print()
    console.print(Rule("[bold green]生成完了[/bold green]", style="green"))
    console.print()

    # ■ 決定した仕様パネル
    spec_text = Text()
    spec_text.append("  使用AIモデル  ", style="dim")
    spec_text.append(f"{result.ai_model}\n", style="bold yellow")
    spec_text.append("  アスペクト比  ", style="dim")
    spec_text.append(f"{result.aspect_ratio}\n", style="bold magenta")
    spec_text.append("  構図の工夫    ", style="dim")
    spec_text.append(f"{result.composition_notes}", style="white")

    console.print(
        Panel(
            spec_text,
            title="[bold]■ 決定した仕様[/bold]",
            title_align="left",
            border_style="yellow",
            padding=(1, 2),
        )
    )

    console.print()

    # ■ 生成用プロンプトパネル
    prompt_text = Text(result.english_prompt, style="bright_white")

    console.print(
        Panel(
            prompt_text,
            title="[bold]■ 生成用プロンプト[/bold]",
            title_align="left",
            border_style="green",
            padding=(1, 2),
        )
    )

    console.print()
    console.print(
        "[dim]上記プロンプトをコピーして Nano Banana 2 / Veo 3.1 に貼り付けてください。[/dim]"
    )
    console.print()


def show_saved(path: Path) -> None:
    """ファイル保存完了の通知を表示する。"""
    console.print(
        Panel(
            Text.assemble(
                ("保存しました: ", "dim"),
                (str(path.resolve()), "bold cyan"),
            ),
            border_style="cyan",
            padding=(0, 2),
        )
    )
    console.print()
