from datetime import datetime
from pathlib import Path

from prompt_builder import GeneratedResult


def build_text(result: GeneratedResult) -> str:
    """GeneratedResult をプレーンテキスト形式に変換する。"""
    return "\n".join([
        "■ 決定した仕様",
        f"  使用AIモデル : {result.ai_model}",
        f"  アスペクト比 : {result.aspect_ratio}",
        f"  構図の工夫   : {result.composition_notes}",
        "",
        "■ 生成用プロンプト",
        result.english_prompt,
        "",
        f"生成日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
    ])


def make_timestamped_path() -> Path:
    """sns_prompt_YYYYMMDD_HHMMSS.txt 形式のパスを返す。"""
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    return Path(f"sns_prompt_{ts}.txt")


def save_result(result: GeneratedResult, path: Path) -> None:
    """結果をファイルに保存する。親ディレクトリが存在しない場合は作成する。"""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(build_text(result), encoding="utf-8")
