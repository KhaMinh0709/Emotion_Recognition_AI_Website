import subprocess
from pathlib import Path
from typing import Optional


def convert_flv_to_mp4(input_path: str, output_path: str, timeout: int = 60) -> None:
    """Convert an input video (FLV or other) to MP4 using ffmpeg.

    Raises RuntimeError on failure.
    """
    input_p = str(input_path)
    output_p = str(output_path)

    cmd = [
        "ffmpeg",
        "-y",
        "-v",
        "error",
        "-i",
        input_p,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        output_p,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg conversion failed: {result.stderr}")


def is_ffmpeg_available() -> bool:
    """Return True if ffmpeg is available on PATH."""
    try:
        r = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, timeout=5)
        return r.returncode == 0
    except Exception:
        return False
