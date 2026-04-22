#!/usr/bin/env python3
"""Auto-provision one Label Studio project per sample modality.

For each of the four modalities (text / image / audio / video):
  1. Create (or reuse) a project with a modality-specific ``label_config``.
  2. Register this ML backend under the project (text project only by default;
     the rule-based backend has real heuristics for text - use ``--ml-all`` to
     register it for every modality).
  3. Import the matching sample tasks:
       - text  -> upload samples/text/tasks.json   (LS native JSON)
       - image -> upload samples/images/*.png,*.jpg (one task per file)
       - audio -> upload samples/audio/*.wav,*.mp3,*.ogg
       - video -> upload samples/video/*.mp4,*.webm
  4. (optional) Trigger "Retrieve Predictions" for tasks.

The script is idempotent: re-running reuses existing projects / ML backends.

Usage:
    python3 scripts/create_projects.py
    python3 scripts/create_projects.py --ls http://localhost:8080 \
                                       --ml http://localhost:9090 \
                                       --samples ./samples \
                                       --ml-all
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import sys
import time
import uuid
from pathlib import Path
from typing import Iterable, Optional
from urllib import error, parse, request
from http.cookiejar import CookieJar


# -----------------------------------------------------------------------------
# Label configs (one per modality) - authored per https://labelstud.io/tags
# -----------------------------------------------------------------------------

TEXT_CONFIG = """
<View>
  <Text name="txt" value="$text"/>
  <Choices name="sentiment" toName="txt" choice="single" showInLine="true">
    <Choice value="Positive"/>
    <Choice value="Neutral"/>
    <Choice value="Negative"/>
  </Choices>
  <Labels name="ner" toName="txt">
    <Label value="EMAIL" background="#f6e05e"/>
    <Label value="URL" background="#fbb6ce"/>
    <Label value="PHONE" background="#9ae6b4"/>
    <Label value="PERSON" background="#c3dafe"/>
  </Labels>
</View>
""".strip()


IMAGE_CONFIG = """
<View>
  <Image name="img" value="$image" zoom="true"/>
  <RectangleLabels name="rect" toName="img">
    <Label value="Object" background="#4f46e5"/>
    <Label value="Text" background="#10b981"/>
    <Label value="Person" background="#f59e0b"/>
  </RectangleLabels>
  <Choices name="scene" toName="img" choice="single" showInLine="true">
    <Choice value="Indoor"/>
    <Choice value="Outdoor"/>
    <Choice value="Other"/>
  </Choices>
</View>
""".strip()


AUDIO_CONFIG = """
<View>
  <Header value="Audio segmentation &amp; transcription"/>
  <Labels name="labels" toName="audio">
    <Label value="Speech" background="#2563eb"/>
    <Label value="Music" background="#059669"/>
    <Label value="Noise" background="#dc2626"/>
  </Labels>
  <AudioPlus name="audio" value="$audio"/>
  <TextArea name="transcription" toName="audio"
            editable="true" perRegion="true"
            placeholder="Transcribe this segment..."/>
</View>
""".strip()


VIDEO_CONFIG = """
<View>
  <Header value="Video tagging"/>
  <Video name="video" value="$video"/>
  <VideoRectangle name="box" toName="video"/>
  <Labels name="videoLabels" toName="video">
    <Label value="Person" background="#2563eb"/>
    <Label value="Car" background="#f59e0b"/>
    <Label value="Object" background="#10b981"/>
  </Labels>
  <Choices name="videoTag" toName="video" choice="single" showInLine="true">
    <Choice value="Daytime"/>
    <Choice value="Night"/>
    <Choice value="Unknown"/>
  </Choices>
</View>
""".strip()


MODALITIES = [
    {
        "key": "text",
        "title": "Sample · Text (Sentiment + NER)",
        "label_config": TEXT_CONFIG,
        "register_ml": True,
        "file_uploads": [],  # tasks imported via JSON, not file upload
        "json_import": "text/tasks.json",
    },
    {
        "key": "image",
        "title": "Sample · Image (Bounding Boxes)",
        "label_config": IMAGE_CONFIG,
        "register_ml": False,
        "file_uploads": ["images/*.png", "images/*.jpg"],
        "json_import": None,
    },
    {
        "key": "audio",
        "title": "Sample · Audio (Segmentation + ASR)",
        "label_config": AUDIO_CONFIG,
        "register_ml": False,
        "file_uploads": ["audio/*.wav", "audio/*.mp3", "audio/*.ogg"],
        "json_import": None,
    },
    {
        "key": "video",
        "title": "Sample · Video (Object Tagging)",
        "label_config": VIDEO_CONFIG,
        "register_ml": False,
        "file_uploads": ["video/*.mp4", "video/*.webm"],
        "json_import": None,
    },
]


# -----------------------------------------------------------------------------
# HTTP helpers (stdlib only, Django-session auth)
# -----------------------------------------------------------------------------


class LS:
    def __init__(self, base: str) -> None:
        self.base = base.rstrip("/")
        self.cj = CookieJar()
        self.opener = request.build_opener(request.HTTPCookieProcessor(self.cj))
        self.csrf: Optional[str] = None

    def login(self, email: str, password: str) -> None:
        login_url = f"{self.base}/user/login/"
        with self.opener.open(login_url, timeout=20) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
        m = re.search(r'name="csrfmiddlewaretoken"\s+value="([^"]+)"', html)
        if not m:
            raise RuntimeError("csrfmiddlewaretoken not found on login page")
        body = parse.urlencode({
            "csrfmiddlewaretoken": m.group(1),
            "email": email,
            "password": password,
        }).encode()
        req = request.Request(login_url, data=body, headers={
            "Referer": login_url,
            "Content-Type": "application/x-www-form-urlencoded",
        })
        with self.opener.open(req, timeout=20) as resp:
            if resp.status not in (200, 302):
                raise RuntimeError(f"login HTTP {resp.status}")
        for ck in self.cj:
            if ck.name == "csrftoken":
                self.csrf = ck.value
                return
        raise RuntimeError("csrftoken cookie missing after login")

    def _json(self, method: str, path: str, payload: Optional[object] = None) -> dict:
        url = f"{self.base}{path}"
        headers = {
            "Content-Type": "application/json",
            "X-CSRFToken": self.csrf or "",
            "Referer": self.base + "/",
            "Accept": "application/json",
        }
        data = None if payload is None else json.dumps(payload).encode()
        req = request.Request(url, data=data, method=method, headers=headers)
        try:
            with self.opener.open(req, timeout=120) as resp:
                raw = resp.read().decode("utf-8", errors="ignore")
        except error.HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"{method} {path} -> HTTP {exc.code}: {raw[:500]}")
        if not raw:
            return {}
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"_raw": raw}

    def get(self, path: str) -> dict: return self._json("GET", path)
    def post(self, path: str, payload: object) -> dict: return self._json("POST", path, payload)
    def patch(self, path: str, payload: object) -> dict: return self._json("PATCH", path, payload)
    def delete(self, path: str) -> dict: return self._json("DELETE", path)

    def _upload_one(self, project_id: int, path: Path) -> dict:
        """POST a single file via multipart/form-data to /api/projects/<id>/import."""
        boundary = f"----formboundary{uuid.uuid4().hex}"
        ctype, _ = mimetypes.guess_type(path.name)
        ctype = ctype or "application/octet-stream"
        data = path.read_bytes()

        body = b"".join([
            f"--{boundary}\r\n".encode(),
            f'Content-Disposition: form-data; name="FILES"; filename="{path.name}"\r\n'.encode(),
            f"Content-Type: {ctype}\r\n\r\n".encode(),
            data,
            f"\r\n--{boundary}--\r\n".encode(),
        ])

        url = f"{self.base}/api/projects/{project_id}/import"
        req = request.Request(url, data=body, method="POST", headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "X-CSRFToken": self.csrf or "",
            "Referer": self.base + "/",
            "Accept": "application/json",
        })
        try:
            with self.opener.open(req, timeout=300) as resp:
                raw = resp.read().decode("utf-8", errors="ignore")
        except error.HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"upload {path.name} -> HTTP {exc.code}: {raw[:500]}")
        try:
            return json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            return {"_raw": raw}

    def upload_files(self, project_id: int, paths: Iterable[Path]) -> dict:
        """Upload files one at a time (LS import endpoint creates 1 task per call)."""
        paths = list(paths)
        total = 0
        for p in paths:
            imp = self._upload_one(project_id, p)
            total += int(imp.get("task_count") or 0)
        return {"task_count": total, "files_uploaded": len(paths)}


# -----------------------------------------------------------------------------
# Orchestration
# -----------------------------------------------------------------------------


def _find_project(ls: LS, title: str) -> Optional[int]:
    data = ls.get("/api/projects/")
    results = data.get("results", data if isinstance(data, list) else [])
    for p in results:
        if isinstance(p, dict) and p.get("title") == title:
            return p.get("id")
    return None


def _find_ml_backend(ls: LS, project_id: int, url: str) -> Optional[int]:
    data = ls.get(f"/api/ml/?project={project_id}")
    items = data if isinstance(data, list) else data.get("results", [])
    for item in items:
        if isinstance(item, dict) and item.get("url") == url:
            return item.get("id")
    return None


def _expand_globs(samples: Path, patterns: list[str]) -> list[Path]:
    out: list[Path] = []
    for pat in patterns:
        out.extend(sorted(samples.glob(pat)))
    return out


def provision(
    ls: LS,
    ml_url: str,
    samples: Path,
    *,
    register_ml_everywhere: bool,
    predict: bool,
    reset: bool,
) -> None:
    for mod in MODALITIES:
        key = mod["key"]
        title = mod["title"]
        print(f"\n=== [{key}] {title} ===")

        existing = _find_project(ls, title)
        if existing and reset:
            print(f"    --reset: deleting existing project id={existing}")
            ls.delete(f"/api/projects/{existing}/")
            existing = None

        if existing:
            project_id = existing
            print(f"    reusing project id={project_id}")
        else:
            created = ls.post("/api/projects/", {
                "title": title,
                "description": f"Auto-provisioned sample project for modality '{key}'.",
                "label_config": mod["label_config"],
            })
            project_id = created["id"]
            print(f"    created project id={project_id}")

        existing_task_count = ls.get(f"/api/projects/{project_id}/").get("task_number") or 0

        # Tasks import
        if mod["json_import"]:
            json_path = samples / mod["json_import"]
            tasks = json.loads(json_path.read_text(encoding="utf-8"))
            if existing_task_count >= len(tasks):
                print(
                    f"    skipping JSON import ({existing_task_count} tasks already present)"
                )
            else:
                payload = [t if "data" in t else {"data": t} for t in tasks]
                imp = ls.post(f"/api/projects/{project_id}/import", payload)
                print(
                    f"    imported tasks from {json_path.name}: task_count={imp.get('task_count')}"
                )

        files = _expand_globs(samples, mod["file_uploads"])
        if files:
            if existing_task_count >= len(files):
                print(
                    f"    skipping file upload ({existing_task_count} tasks already present)"
                )
            else:
                imp = ls.upload_files(project_id, files)
                print(
                    f"    uploaded {len(files)} file(s): task_count={imp.get('task_count')}"
                )

        # ML backend registration
        if mod["register_ml"] or register_ml_everywhere:
            ml_id = _find_ml_backend(ls, project_id, ml_url)
            if ml_id:
                print(f"    reusing ML backend id={ml_id} at {ml_url}")
            else:
                ml = ls.post("/api/ml/", {
                    "project": project_id,
                    "url": ml_url,
                    "title": "pre-label-v1",
                    "description": "Pre-labeling ML backend (rule-based).",
                    "is_interactive": False,
                    "auth_method": "NONE",
                })
                print(
                    f"    registered ML backend id={ml.get('id')} "
                    f"state={ml.get('readable_state')} model_version={ml.get('model_version')}"
                )
            ls.patch(f"/api/projects/{project_id}/", {
                "model_version": "pre-label-v1",
                "show_collab_predictions": True,
            })

            if predict:
                action = ls.post(
                    f"/api/dm/actions?id=retrieve_tasks_predictions&project={project_id}",
                    {"selectedItems": {"all": True, "excluded": []}, "project": project_id},
                )
                print(f"    retrieve predictions: {action.get('detail', action)}")

        print(f"    view: {ls.base}/projects/{project_id}/data")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ls", default="http://localhost:8080", help="Label Studio base URL")
    ap.add_argument("--ml", default="http://localhost:9090",
                    help="ML backend URL as reachable from Label Studio")
    ap.add_argument("--user", default="admin@example.com")
    ap.add_argument("--password", default="admin12345")
    ap.add_argument(
        "--samples",
        default=str(Path(__file__).resolve().parent.parent / "samples"),
        help="Path to the samples/ directory (default: repo's samples/)",
    )
    ap.add_argument("--ml-all", action="store_true",
                    help="Register ML backend in every project (default: text only)")
    ap.add_argument("--no-predict", action="store_true", help="Skip Retrieve Predictions")
    ap.add_argument("--reset", action="store_true", help="Delete existing sample projects first")
    args = ap.parse_args()

    samples_dir = Path(os.path.expanduser(args.samples)).resolve()
    if not samples_dir.exists():
        print(f"[error] samples directory not found: {samples_dir}", file=sys.stderr)
        return 2

    ls = LS(args.ls)
    print(f"[*] logging in to {args.ls} as {args.user}")
    ls.login(args.user, args.password)

    provision(
        ls,
        ml_url=args.ml,
        samples=samples_dir,
        register_ml_everywhere=args.ml_all,
        predict=not args.no_predict,
        reset=args.reset,
    )
    print("")
    print(f"Done. Open {args.ls}/projects/ to browse the four new sample projects.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
