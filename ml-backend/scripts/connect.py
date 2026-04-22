#!/usr/bin/env python3
"""Connect this ML backend to a running Label Studio instance.

What it does (idempotent):
  1. POSTs to /user/login/ with CSRF to get a session cookie.
  2. Creates (or reuses) a demo project with a text-classification label config.
  3. Imports a few sample tasks.
  4. Registers the ML backend URL under the project (POST /api/ml/).
  5. Sets project.model_version = <backend model version>.
  6. Triggers "Retrieve Predictions" for all tasks.
  7. Prints a summary of the resulting predictions.

Usage (defaults match scripts/start-all.sh):
  python scripts/connect.py                               # uses localhost defaults
  python scripts/connect.py --ls http://localhost:8080 \
                            --ml http://localhost:9090 \
                            --user admin@example.com \
                            --password admin12345

The ML backend URL the script passes to Label Studio must be reachable *from
Label Studio's process*, not just from your browser. When LS runs in Docker
and the ML backend on the host, use `--ml http://host.docker.internal:9090`
(or the docker-compose service name `http://ml-backend:9090`).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from typing import Optional
from urllib import error, parse, request
from http.cookiejar import CookieJar


DEFAULT_LABEL_CONFIG = """
<View>
  <Text name="txt" value="$text"/>
  <Choices name="s" toName="txt" choice="single">
    <Choice value="Positive"/>
    <Choice value="Neutral"/>
    <Choice value="Negative"/>
  </Choices>
  <Labels name="ner" toName="txt">
    <Label value="EMAIL" background="#f6e05e"/>
    <Label value="URL"   background="#fbb6ce"/>
    <Label value="PHONE" background="#9ae6b4"/>
  </Labels>
</View>
""".strip()

SAMPLE_TASKS = [
    {"text": "This is a great and wonderful product, I love it!"},
    {"text": "This was a terrible experience, absolutely awful and broken."},
    {"text": "It was ok, just average, nothing special."},
    {"text": "Email me at alice@example.com or visit https://openai.com"},
    {"text": "请帮我处理一下这个非常棒的产品"},
]


class LSSession:
    def __init__(self, base: str) -> None:
        self.base = base.rstrip("/")
        self.cj = CookieJar()
        self.opener = request.build_opener(request.HTTPCookieProcessor(self.cj))
        self.csrf: Optional[str] = None

    # ------------------------------------------------------------------ auth
    def login(self, email: str, password: str) -> None:
        login_url = f"{self.base}/user/login/"
        with self.opener.open(login_url, timeout=20) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
        m = re.search(r'name="csrfmiddlewaretoken"\s+value="([^"]+)"', html)
        if not m:
            raise RuntimeError("could not find csrfmiddlewaretoken on /user/login/")
        form_csrf = m.group(1)

        data = parse.urlencode({
            "csrfmiddlewaretoken": form_csrf,
            "email": email,
            "password": password,
        }).encode()

        req = request.Request(
            login_url,
            data=data,
            headers={
                "Referer": login_url,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )
        with self.opener.open(req, timeout=20) as resp:
            status = resp.status
            if status not in (200, 302):
                raise RuntimeError(f"login failed with HTTP {status}")

        for ck in self.cj:
            if ck.name == "csrftoken":
                self.csrf = ck.value
                break
        if not self.csrf:
            raise RuntimeError("login succeeded but csrftoken cookie missing")

    # ------------------------------------------------------------------ api
    def _api(self, method: str, path: str, payload: Optional[dict] = None) -> dict:
        url = f"{self.base}{path}"
        body = None
        headers = {
            "Content-Type": "application/json",
            "X-CSRFToken": self.csrf or "",
            "Referer": self.base + "/",
            "Accept": "application/json",
        }
        if payload is not None:
            body = json.dumps(payload).encode()
        req = request.Request(url, data=body, method=method, headers=headers)
        try:
            with self.opener.open(req, timeout=60) as resp:
                raw = resp.read().decode("utf-8", errors="ignore")
        except error.HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(
                f"{method} {path} -> HTTP {exc.code}: {raw[:400]}"
            ) from None
        if not raw:
            return {}
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"_raw": raw}

    # Convenience helpers
    def get(self, path: str) -> dict: return self._api("GET", path)
    def post(self, path: str, payload: dict) -> dict: return self._api("POST", path, payload)
    def patch(self, path: str, payload: dict) -> dict: return self._api("PATCH", path, payload)


def _find_project(ls: LSSession, title: str) -> Optional[int]:
    data = ls.get("/api/projects/")
    results = data.get("results", data if isinstance(data, list) else [])
    for p in results:
        if isinstance(p, dict) and p.get("title") == title:
            return p.get("id")
    return None


def _find_ml_backend(ls: LSSession, project_id: int, url: str) -> Optional[int]:
    data = ls.get(f"/api/ml/?project={project_id}")
    items = data if isinstance(data, list) else data.get("results", [])
    for item in items:
        if isinstance(item, dict) and item.get("url") == url:
            return item.get("id")
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ls", default="http://localhost:8080", help="Label Studio base URL")
    ap.add_argument("--ml", default="http://localhost:9090", help="ML backend URL as seen by Label Studio")
    ap.add_argument("--user", default="admin@example.com")
    ap.add_argument("--password", default="admin12345")
    ap.add_argument("--title", default="Pre-label demo")
    ap.add_argument("--ml-title", default="pre-label-v1")
    ap.add_argument("--no-sample-tasks", action="store_true")
    ap.add_argument("--no-predict", action="store_true")
    args = ap.parse_args()

    ls = LSSession(args.ls)

    print(f"[1/6] logging in to {args.ls} as {args.user}")
    ls.login(args.user, args.password)

    print("[2/6] ensuring project exists")
    project_id = _find_project(ls, args.title)
    if project_id:
        print(f"      reusing project id={project_id}")
    else:
        proj = ls.post("/api/projects/", {
            "title": args.title,
            "description": "Demo project wired to the pre-labeling ML backend.",
            "label_config": DEFAULT_LABEL_CONFIG,
        })
        project_id = proj["id"]
        print(f"      created project id={project_id}")

    if not args.no_sample_tasks:
        print("[3/6] importing sample tasks")
        imp = ls.post(f"/api/projects/{project_id}/import", SAMPLE_TASKS)
        print(f"      imported task_count={imp.get('task_count')}")

    print("[4/6] ensuring ML backend is registered")
    ml_id = _find_ml_backend(ls, project_id, args.ml)
    if ml_id:
        print(f"      reusing ML backend id={ml_id}")
    else:
        ml = ls.post("/api/ml/", {
            "project": project_id,
            "url": args.ml,
            "title": args.ml_title,
            "description": "Pre-labeling ML backend (rule-based).",
            "is_interactive": False,
            "auth_method": "NONE",
        })
        ml_id = ml.get("id")
        print(
            f"      registered ML backend id={ml_id} "
            f"state={ml.get('readable_state')} model_version={ml.get('model_version')}"
        )

    ls.patch(f"/api/projects/{project_id}/", {
        "model_version": args.ml_title,
        "show_collab_predictions": True,
    })

    if args.no_predict:
        print("[5/6] skipping predictions (per --no-predict)")
        return 0

    print("[5/6] asking Label Studio to retrieve predictions for all tasks")
    action = ls.post(
        f"/api/dm/actions?id=retrieve_tasks_predictions&project={project_id}",
        {"selectedItems": {"all": True, "excluded": []}, "project": project_id},
    )
    print(f"      {action.get('detail', action)}")

    time.sleep(1)

    print("[6/6] summary")
    preds = ls.get(f"/api/predictions/?task__project={project_id}")
    if isinstance(preds, dict) and "results" in preds:
        preds = preds["results"]
    print(f"      predictions: {len(preds)}")
    for p in preds:
        choice = "(empty)"
        if p.get("result"):
            value = p["result"][0].get("value", {})
            if value.get("choices"):
                choice = value["choices"][0]
            elif value.get("labels"):
                choice = value["labels"][0]
        print(
            f"      task={p.get('task')} model={p.get('model_version')} "
            f"score={p.get('score')} -> {choice}"
        )

    print("")
    print(f"Done. Open {args.ls}/projects/{project_id}/data to view predictions.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
