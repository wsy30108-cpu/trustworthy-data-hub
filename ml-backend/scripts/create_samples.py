#!/usr/bin/env python3
"""Generate sample data files compatible with Label Studio's import formats.

Produces under ``<output_dir>``:

  text/
    sample.txt                 single plain-text document
    articles.txt               newline-separated, one text per line
    tasks.json                 LS import JSON (multi-task array)
    tasks.jsonl                LS import JSON Lines
    tasks.csv                  LS import CSV
    tasks.tsv                  LS import TSV
    image_tasks.json           JSON referencing hosted image URLs

  images/
    red.png                    8x8 solid color PNG
    green.png                  8x8 solid color PNG
    blue.png                   8x8 solid color PNG
    gradient.jpg               256x192 gradient JPEG (ffmpeg)
    gradient.png               256x192 gradient PNG (ffmpeg)

  audio/
    tone_440hz_1s.wav          1 second 440 Hz sine (PCM 16-bit, 16 kHz mono)
    sweep_2s.wav               2 second linear sweep 220->880 Hz
    tone_440hz.mp3             same tone transcoded to MP3 (ffmpeg)
    tone_440hz.ogg             same tone as OGG Vorbis (ffmpeg)

  video/
    video_3s.mp4               3 second 320x240 test pattern (ffmpeg)
    video_3s.webm              same in WebM (ffmpeg)

All Label Studio import manifests reference local paths (text/images) or
embedded audio/video URLs - see README.md for how to import each of them.
"""

from __future__ import annotations

import argparse
import base64
import csv
import json
import math
import os
import shutil
import struct
import subprocess
import sys
import wave
import zlib
from pathlib import Path


TEXT_SAMPLES = [
    {
        "id": 1,
        "text": "This is a great and wonderful product, I love it!",
        "language": "en",
        "topic": "review",
    },
    {
        "id": 2,
        "text": "This was a terrible experience, absolutely awful and broken.",
        "language": "en",
        "topic": "review",
    },
    {
        "id": 3,
        "text": "It was ok, just average, nothing special.",
        "language": "en",
        "topic": "review",
    },
    {
        "id": 4,
        "text": "Contact alice@example.com or call +1 415 555 1234 to request a refund.",
        "language": "en",
        "topic": "support",
    },
    {
        "id": 5,
        "text": "请帮我处理一下这个非常棒的产品，谢谢！",
        "language": "zh",
        "topic": "support",
    },
    {
        "id": 6,
        "text": "太糟糕了，我对这次购物非常失望。",
        "language": "zh",
        "topic": "review",
    },
]


# -----------------------------------------------------------------------------
# PNG helpers (no Pillow dependency; produce valid 8x8 RGBA PNGs)
# -----------------------------------------------------------------------------


def _png_chunk(kind: bytes, data: bytes) -> bytes:
    chunk = kind + data
    return struct.pack("!I", len(data)) + chunk + struct.pack("!I", zlib.crc32(chunk) & 0xFFFFFFFF)


def _write_solid_png(path: Path, r: int, g: int, b: int, size: int = 8) -> None:
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack("!IIBBBBB", size, size, 8, 2, 0, 0, 0)  # 8-bit RGB, no alpha
    raw = b""
    for _ in range(size):
        raw += b"\x00"  # filter type 0 per scanline
        raw += bytes([r, g, b]) * size
    idat = zlib.compress(raw, 9)
    png = sig + _png_chunk(b"IHDR", ihdr) + _png_chunk(b"IDAT", idat) + _png_chunk(b"IEND", b"")
    path.write_bytes(png)


# -----------------------------------------------------------------------------
# WAV helpers (stdlib only)
# -----------------------------------------------------------------------------


def _write_sine_wav(path: Path, freq: float, seconds: float, rate: int = 16000) -> None:
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        frames = int(seconds * rate)
        data = bytearray()
        amp = 0.3 * 32767
        for n in range(frames):
            t = n / rate
            sample = int(amp * math.sin(2 * math.pi * freq * t))
            data += struct.pack("<h", sample)
        w.writeframes(bytes(data))


def _write_sweep_wav(path: Path, f0: float, f1: float, seconds: float, rate: int = 16000) -> None:
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        frames = int(seconds * rate)
        data = bytearray()
        amp = 0.3 * 32767
        for n in range(frames):
            t = n / rate
            k = (f1 - f0) / seconds
            phase = 2 * math.pi * (f0 * t + 0.5 * k * t * t)
            data += struct.pack("<h", int(amp * math.sin(phase)))
        w.writeframes(bytes(data))


# -----------------------------------------------------------------------------
# ffmpeg helpers (optional - skip gracefully if missing)
# -----------------------------------------------------------------------------


def _have_ffmpeg() -> bool:
    return shutil.which("ffmpeg") is not None


def _run_ffmpeg(args: list[str]) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args],
        check=True,
    )


# -----------------------------------------------------------------------------
# Main generator
# -----------------------------------------------------------------------------


def generate(out: Path) -> None:
    text_dir = out / "text"
    img_dir = out / "images"
    audio_dir = out / "audio"
    video_dir = out / "video"
    for d in (text_dir, img_dir, audio_dir, video_dir):
        d.mkdir(parents=True, exist_ok=True)

    # --- text ---------------------------------------------------------------
    # 1. plain .txt (single doc)
    (text_dir / "sample.txt").write_text(
        "Label Studio sample text.\n"
        "This file is a single document; import it from the 'Upload files' "
        "tab with 'Treat each file as one task' = ON.\n\n"
        "Contact alice@example.com or visit https://labelstud.io for docs.\n",
        encoding="utf-8",
    )

    # 2. multi-line txt (one text per task)
    (text_dir / "articles.txt").write_text(
        "\n".join(t["text"] for t in TEXT_SAMPLES) + "\n",
        encoding="utf-8",
    )

    # 3. JSON array (LS native format)
    (text_dir / "tasks.json").write_text(
        json.dumps(
            [{"id": t["id"], "data": {"text": t["text"], "language": t["language"], "topic": t["topic"]}} for t in TEXT_SAMPLES],
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    # 4. JSON Lines
    with (text_dir / "tasks.jsonl").open("w", encoding="utf-8") as fp:
        for t in TEXT_SAMPLES:
            fp.write(json.dumps(
                {"id": t["id"], "data": {"text": t["text"], "language": t["language"], "topic": t["topic"]}},
                ensure_ascii=False,
            ) + "\n")

    # 5. CSV / TSV (LS treats header row as data keys)
    with (text_dir / "tasks.csv").open("w", encoding="utf-8", newline="") as fp:
        w = csv.writer(fp)
        w.writerow(["text", "language", "topic"])
        for t in TEXT_SAMPLES:
            w.writerow([t["text"], t["language"], t["topic"]])
    with (text_dir / "tasks.tsv").open("w", encoding="utf-8", newline="") as fp:
        w = csv.writer(fp, delimiter="\t")
        w.writerow(["text", "language", "topic"])
        for t in TEXT_SAMPLES:
            w.writerow([t["text"], t["language"], t["topic"]])

    # 6. JSON manifest for image tasks (uses public URLs, works without LS storage)
    image_tasks = [
        {"data": {"image": "https://data.heartex.net/open-images/train_0/mini/00155094b7acc8c4.jpg", "caption": "street"}},
        {"data": {"image": "https://data.heartex.net/open-images/train_0/mini/000a1249af2bc5f0.jpg", "caption": "people"}},
        {"data": {"image": "https://data.heartex.net/open-images/train_0/mini/00057e70f4d6700f.jpg", "caption": "animal"}},
    ]
    (text_dir / "image_tasks.json").write_text(
        json.dumps(image_tasks, ensure_ascii=False, indent=2), encoding="utf-8",
    )

    # --- images -------------------------------------------------------------
    _write_solid_png(img_dir / "red.png",   255, 32, 32)
    _write_solid_png(img_dir / "green.png", 32, 200, 48)
    _write_solid_png(img_dir / "blue.png",  48, 96, 240)

    if _have_ffmpeg():
        _run_ffmpeg([
            "-f", "lavfi", "-i", "gradients=s=256x192:duration=1",
            "-frames:v", "1", str(img_dir / "gradient.png"),
        ])
        _run_ffmpeg([
            "-f", "lavfi", "-i", "gradients=s=256x192:duration=1",
            "-frames:v", "1", "-q:v", "2", str(img_dir / "gradient.jpg"),
        ])

    # --- audio --------------------------------------------------------------
    _write_sine_wav(audio_dir / "tone_440hz_1s.wav", freq=440.0, seconds=1.0)
    _write_sweep_wav(audio_dir / "sweep_2s.wav", f0=220.0, f1=880.0, seconds=2.0)

    if _have_ffmpeg():
        _run_ffmpeg([
            "-i", str(audio_dir / "tone_440hz_1s.wav"),
            "-codec:a", "libmp3lame", "-q:a", "4",
            str(audio_dir / "tone_440hz.mp3"),
        ])
        _run_ffmpeg([
            "-i", str(audio_dir / "tone_440hz_1s.wav"),
            "-codec:a", "libvorbis",
            str(audio_dir / "tone_440hz.ogg"),
        ])

    # --- video --------------------------------------------------------------
    if _have_ffmpeg():
        _run_ffmpeg([
            "-f", "lavfi", "-i", "testsrc=size=320x240:rate=24:duration=3",
            "-f", "lavfi", "-i", "sine=frequency=440:duration=3:sample_rate=16000",
            "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "96k", "-shortest",
            "-movflags", "+faststart",
            str(video_dir / "video_3s.mp4"),
        ])
        _run_ffmpeg([
            "-f", "lavfi", "-i", "testsrc=size=320x240:rate=24:duration=3",
            "-f", "lavfi", "-i", "sine=frequency=440:duration=3:sample_rate=16000",
            "-c:v", "libvpx-vp9", "-deadline", "realtime", "-cpu-used", "8",
            "-c:a", "libopus", "-b:a", "64k", "-shortest",
            str(video_dir / "video_3s.webm"),
        ])

    # --- README inside the folder -------------------------------------------
    (out / "README.md").write_text(_readme_text(), encoding="utf-8")


def _readme_text() -> str:
    return (
        "# Label Studio Sample Files\n\n"
        "These files are laid out to match Label Studio's official import formats.\n"
        "See https://labelstud.io/guide/tasks for the authoritative reference.\n\n"
        "## text/\n"
        "| File | Usage in Label Studio |\n"
        "| --- | --- |\n"
        "| `sample.txt`       | Upload under **Project → Import**. Enable *Treat each file as one task*. |\n"
        "| `articles.txt`     | Same upload path; LS creates one task per non-empty line. |\n"
        "| `tasks.json`       | Native LS JSON array import. Each entry already has `data`. |\n"
        "| `tasks.jsonl`      | JSON-Lines variant of `tasks.json`. |\n"
        "| `tasks.csv`        | LS reads header row as keys: `text`, `language`, `topic`. |\n"
        "| `tasks.tsv`        | Tab-separated variant. |\n"
        "| `image_tasks.json` | JSON referencing public image URLs; import into an image-labeling project. |\n\n"
        "Suggested labeling config for the text tasks:\n\n"
        "```xml\n"
        "<View>\n"
        "  <Text name=\"txt\" value=\"$text\"/>\n"
        "  <Choices name=\"sentiment\" toName=\"txt\" choice=\"single\">\n"
        "    <Choice value=\"Positive\"/><Choice value=\"Neutral\"/><Choice value=\"Negative\"/>\n"
        "  </Choices>\n"
        "  <Labels name=\"ner\" toName=\"txt\">\n"
        "    <Label value=\"EMAIL\"/><Label value=\"URL\"/><Label value=\"PHONE\"/>\n"
        "  </Labels>\n"
        "</View>\n"
        "```\n\n"
        "## images/\n"
        "PNG + JPG files uploadable directly under **Project → Import** in an\n"
        "image-labeling project. Use label config:\n\n"
        "```xml\n"
        "<View>\n"
        "  <Image name=\"img\" value=\"$image\"/>\n"
        "  <RectangleLabels name=\"rect\" toName=\"img\">\n"
        "    <Label value=\"Object\"/>\n"
        "  </RectangleLabels>\n"
        "</View>\n"
        "```\n\n"
        "## audio/\n"
        "Drop `.wav`, `.mp3`, `.ogg` files into an audio project. Label config:\n\n"
        "```xml\n"
        "<View>\n"
        "  <Audio name=\"audio\" value=\"$audio\"/>\n"
        "  <Labels name=\"labels\" toName=\"audio\">\n"
        "    <Label value=\"Speech\"/><Label value=\"Noise\"/>\n"
        "  </Labels>\n"
        "</View>\n"
        "```\n\n"
        "## video/\n"
        "`.mp4` and `.webm` files for a video-labeling project:\n\n"
        "```xml\n"
        "<View>\n"
        "  <Video name=\"video\" value=\"$video\"/>\n"
        "  <VideoRectangle name=\"box\" toName=\"video\"/>\n"
        "  <Labels name=\"labels\" toName=\"video\">\n"
        "    <Label value=\"Person\"/><Label value=\"Car\"/>\n"
        "  </Labels>\n"
        "</View>\n"
        "```\n"
    )


def main() -> int:
    ap = argparse.ArgumentParser(description="Generate Label Studio sample files.")
    ap.add_argument(
        "output",
        nargs="?",
        default=str(Path.home() / "Desktop" / "label-studio-samples"),
        help="Output directory (default: ~/Desktop/label-studio-samples)",
    )
    args = ap.parse_args()

    out = Path(os.path.expanduser(args.output)).resolve()
    out.mkdir(parents=True, exist_ok=True)

    if not _have_ffmpeg():
        print("[warn] ffmpeg not found; JPG / MP3 / OGG / MP4 / WEBM will be skipped.",
              file=sys.stderr)

    generate(out)
    print(f"[ok] wrote sample files under: {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
