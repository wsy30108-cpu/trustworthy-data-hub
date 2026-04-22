# Label Studio Pre-labeling ML Backend

A ready-to-deploy [Label Studio](https://labelstud.io/guide/ml) ML backend that
provides **pre-labeling (model-assisted pre-annotations)** for your projects.
It speaks the exact HTTP protocol Label Studio expects, so once it is running
you can plug it into a project under *Settings → Model → Connect Model*.

The service ships with a zero-dependency rule-based engine so you can spin it
up instantly, then swap in a real model (HF transformers, YOLO, LLM, …) by
editing `app/model.py` without touching the protocol layer.

---

## Features

- FastAPI implementation of the full Label Studio ML-backend API:
  `/health`, `/setup`, `/predict`, `/webhook`, `/train`, `/versions`, `/metrics`
- Parses the project's `label_config` XML and emits predictions that match
  the schema (`from_name` / `to_name` / `type` / `value`)
- Built-in pre-labeling strategies for the most common Label Studio tags:
  - `Choices` — text / intent / sentiment classification
  - `Labels` — NER-style span labeling on text (EMAIL / URL / PHONE / DATE / MONEY / PERSON / ORG / LOCATION)
  - `RectangleLabels` — sensible default bounding box on images
  - `TextArea` — auto-summary suggestion
  - `Rating` — 1..5 based on sentiment
- Optional shared-secret auth (`ML_SHARED_SECRET`)
- Ships with a `docker-compose.yml` that also starts Label Studio, so you
  have a fully wired verification environment with one command

---

## Quick start — verify locally in 30 seconds

### Option A · Python (fastest)

```bash
cd ml-backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 9090
```

Open <http://127.0.0.1:9090/> — you will see the backend info page.
Swagger UI lives at <http://127.0.0.1:9090/docs>.

### Option B · Docker Compose (Label Studio + ML backend together)

```bash
cd ml-backend
docker compose up -d
```

- Label Studio → <http://localhost:8080>
  (default login: `admin@example.com` / `admin12345`)
- ML backend → <http://localhost:9090>

### Option C · One-shot script (no Docker needed)

If you don't have Docker, use the bundled launcher. It `pip install`s
Label Studio + this backend's deps, then starts both processes.

```bash
cd ml-backend
./scripts/start-all.sh --bg       # background; logs under ./.run/
# or
./scripts/start-all.sh            # foreground (Ctrl-C stops)
```

Stop the background services again with:

```bash
./scripts/start-all.sh --stop
```

---

## Label Studio login address

Once Label Studio is running, open the login page in your browser:

| What | URL |
| --- | --- |
| **Login page** | <http://localhost:8080/user/login/> |
| Home (redirects to login) | <http://localhost:8080/> |
| Sign-up page | <http://localhost:8080/user/signup/> |
| Swagger API docs | <http://localhost:8080/docs/api> |

Default credentials (from `docker-compose.yml` and `scripts/start-all.sh`):

| Field | Value |
| --- | --- |
| Email | `admin@example.com` |
| Password | `admin12345` |
| API token | `0123456789abcdef0123456789abcdef01234567` |

> On first login Label Studio will ask you to confirm the workspace.
> You can override the defaults with env vars `LS_USER`, `LS_PASSWORD`,
> `LS_TOKEN` when calling `scripts/start-all.sh`, or via
> `LABEL_STUDIO_USERNAME` / `LABEL_STUDIO_PASSWORD` in `docker-compose.yml`.

---

## Verification address

After starting the service, the following URLs let you verify everything
end-to-end:

| Purpose | URL |
| --- | --- |
| Landing / status page | <http://127.0.0.1:9090/> |
| **Health probe (used by Label Studio *Validate and save*)** | <http://127.0.0.1:9090/health> |
| OpenAPI / Swagger UI | <http://127.0.0.1:9090/docs> |
| Model versions | <http://127.0.0.1:9090/versions> |
| Metrics / counters | <http://127.0.0.1:9090/metrics> |

A successful `/health` response looks like:

```json
{
  "status": "UP",
  "model_version": "pre-label-v1",
  "model_loaded": true,
  "uptime_seconds": 3.14
}
```

---

## Connect to Label Studio

### A · Automated (recommended for a first try)

Two helper scripts are provided:

#### `scripts/create_projects.py` (one project per modality) 🆕

Logs in, provisions **four projects** that cover every Label-Studio-supported
modality, imports the matching sample files, registers this ML backend in each
project, and pre-labels every task:

| Project | Label config | Tasks | Source |
| --- | --- | --- | --- |
| `Sample · Text (Sentiment + NER)` | `Choices` + `Labels` | 6 | `samples/text/tasks.json` |
| `Sample · Image (Bounding Boxes)` | `RectangleLabels` + `Choices` | 5 | `samples/images/*.png,*.jpg` |
| `Sample · Audio (Segmentation + ASR)` | `Labels` + `TextArea` on `Audio` | 4 | `samples/audio/*.wav,*.mp3,*.ogg` |
| `Sample · Video (Object Tagging)` | `Labels` + `Choices` on `Video` | 2 | `samples/video/*.mp4,*.webm` |

```bash
# after both services are up (scripts/start-all.sh --bg)
python3 scripts/create_projects.py                    # idempotent
python3 scripts/create_projects.py --reset            # wipe and re-create
python3 scripts/create_projects.py --reset --ml-all   # also register ML in image/audio/video projects
```

#### `scripts/connect.py` (single-project smoke test)

Logs into Label Studio, creates a single demo project with a text-classification +
NER label config, imports 5 sample tasks, registers this ML backend, and
asks Label Studio to pre-label every task.

```bash
python3 scripts/connect.py
# or against a remote Label Studio:
python3 scripts/connect.py --ls http://my-ls:8080 --ml http://my-ml:9090
```

Expected output:

```
[1/6] logging in to http://localhost:8080 as admin@example.com
[2/6] ensuring project exists
      created project id=1
[3/6] importing sample tasks
      imported task_count=5
[4/6] ensuring ML backend is registered
      registered ML backend id=1 state=Connected model_version=pre-label-v1
[5/6] asking Label Studio to retrieve predictions for all tasks
      Retrieved 5 predictions
[6/6] summary
      predictions: 5
      task=1 model=pre-label-v1 score=0.8 -> Positive
      task=2 model=pre-label-v1 score=0.8 -> Negative
      ...
Done. Open http://localhost:8080/projects/1/data to view predictions.
```

The script is **idempotent** — re-running it will reuse the project and the
ML backend registration; it just adds new sample tasks and triggers a
new prediction pass.

### B · Manual (UI flow)

1. Open your Label Studio project.
2. Go to **Settings → Model → Connect Model**.
3. Fill in the form:
   - **Name**: `pre-label-v1`
   - **Backend URL**: `http://<host-where-this-runs>:9090`
     - Same machine as LS → `http://localhost:9090`
     - Docker-compose bundle → `http://ml-backend:9090`
   - **Interactive pre-annotations**: ON (optional)
4. Click **Validate and Save**. Label Studio will hit `/health` and `/setup`.
5. Under **Settings → Annotation**, enable:
   - ✅ *Use predictions to pre-label tasks*
   - ✅ (optional) *Retrieve predictions when loading a task automatically*
6. Open any task — predictions from this backend will appear as suggestions.

### C · Manual (REST API, no browser)

```bash
# 1. login → cookie jar (LS uses Django session auth)
curl -s -c /tmp/ls.cookies http://localhost:8080/user/login/ -o /tmp/login.html
CSRF=$(grep csrfmiddlewaretoken /tmp/login.html | head -1 | sed -E 's/.*value="([^"]+)".*/\1/')
curl -s -b /tmp/ls.cookies -c /tmp/ls.cookies -X POST http://localhost:8080/user/login/ \
  -H "Referer: http://localhost:8080/user/login/" \
  -d "csrfmiddlewaretoken=$CSRF&email=admin@example.com&password=admin12345" -o /dev/null
CSRF=$(awk '/csrftoken/{print $7}' /tmp/ls.cookies)

# 2. register the ML backend under project <ID>
curl -s -b /tmp/ls.cookies -X POST http://localhost:8080/api/ml/ \
  -H "Content-Type: application/json" -H "X-CSRFToken: $CSRF" \
  -H "Referer: http://localhost:8080/" \
  -d '{"project": 1, "url": "http://localhost:9090", "title": "pre-label-v1"}'

# 3. ask LS to fetch predictions from it
curl -s -b /tmp/ls.cookies -X POST \
  "http://localhost:8080/api/dm/actions?id=retrieve_tasks_predictions&project=1" \
  -H "Content-Type: application/json" -H "X-CSRFToken: $CSRF" \
  -H "Referer: http://localhost:8080/" \
  -d '{"selectedItems":{"all":true,"excluded":[]},"project":1}'
```

### Supported labeling configs (examples)

**Text classification**

```xml
<View>
  <Text name="txt" value="$text"/>
  <Choices name="sentiment" toName="txt" choice="single">
    <Choice value="Positive"/><Choice value="Neutral"/><Choice value="Negative"/>
  </Choices>
</View>
```

**NER**

```xml
<View>
  <Labels name="ner" toName="txt">
    <Label value="EMAIL"/><Label value="PHONE"/><Label value="URL"/>
    <Label value="DATE"/><Label value="MONEY"/><Label value="PERSON"/>
  </Labels>
  <Text name="txt" value="$text"/>
</View>
```

**Image bounding boxes**

```xml
<View>
  <Image name="img" value="$image"/>
  <RectangleLabels name="rect" toName="img">
    <Label value="Person"/><Label value="Car"/>
  </RectangleLabels>
</View>
```

---

## Manual smoke-test with `curl`

```bash
# 1) Health
curl -s http://127.0.0.1:9090/health | jq

# 2) Pre-label a batch of tasks
curl -s -X POST http://127.0.0.1:9090/predict \
  -H 'Content-Type: application/json' \
  -d '{
    "tasks": [
      {"id": 1, "data": {"text": "This is a great and wonderful product!"}},
      {"id": 2, "data": {"text": "Contact alice@example.com for a refund."}}
    ],
    "label_config": "<View><Text name=\"txt\" value=\"$text\"/><Choices name=\"s\" toName=\"txt\"><Choice value=\"Positive\"/><Choice value=\"Negative\"/></Choices></View>"
  }' | jq
```

Expected (truncated):

```json
{
  "model_version": "pre-label-v1",
  "results": [
    { "score": 0.7, "result": [ { "from_name": "s", "to_name": "txt",
      "type": "choices", "value": { "choices": ["Positive"] } } ] },
    ...
  ]
}
```

---

## Sample data files

A ready-made set of Label-Studio-compatible sample files lives under
[`samples/`](samples/). The layout matches LS's supported import types (see
<https://labelstud.io/guide/tasks>):

```
samples/
├── text/
│   ├── sample.txt            single plain-text doc
│   ├── articles.txt          one text per line
│   ├── tasks.json            LS native JSON array
│   ├── tasks.jsonl           LS JSON Lines
│   ├── tasks.csv / tasks.tsv LS CSV/TSV
│   └── image_tasks.json      JSON referencing public image URLs
├── images/                   red/green/blue PNG + gradient PNG/JPG
├── audio/                    WAV (sine 440 Hz & 220-880 Hz sweep) + MP3/OGG
└── video/                    video_3s.mp4 and video_3s.webm (test pattern + 440 Hz tone)
```

Each subfolder + the sample `README.md` inside include the exact LS label
config to copy/paste.

### Drop these onto your Desktop

Run the launcher on **your own machine**; it writes to
`~/Desktop/label-studio-samples/` (or `%USERPROFILE%\Desktop\…` on
Windows-Git-Bash). Only Python 3 is required; `ffmpeg` is optional and only
needed for the `.jpg / .mp3 / .ogg / .mp4 / .webm` files.

```bash
cd ml-backend
./scripts/create-desktop-samples.sh
# or, to write somewhere else:
./scripts/create-desktop-samples.sh /tmp/ls-samples
# or call the Python generator directly:
python3 scripts/create_samples.py "$HOME/Desktop/label-studio-samples"
```

Then in Label Studio: create a project, paste the matching label config
from `samples/README.md`, go to **Project → Import**, and drag in the files
from the matching subfolder.

---

## Environment variables

| Var | Default | Meaning |
| --- | --- | --- |
| `ML_HOST` | `0.0.0.0` | Bind host |
| `ML_PORT` | `9090` | Bind port |
| `MODEL_VERSION` | `pre-label-v1` | Reported to Label Studio |
| `LABEL_STUDIO_URL` | — | Used by the optional REST client (`app/ls_client.py`) |
| `LABEL_STUDIO_API_KEY` | — | Access token generated in LS |
| `ML_SHARED_SECRET` | — | If set, `/predict`, `/setup`, `/train`, `/webhook` require `Authorization: Token <value>` |

---

## Tests

```bash
cd ml-backend
pip install -r requirements.txt
pytest
```

The test suite covers: `/health`, `/setup`, `/predict` (text classification,
NER span extraction, image rectangles, batching), `/webhook`, `/train`,
`/versions`, and `/metrics` counters.

---

## Swapping in a real model

Replace the `_predict_for_control` branches in
[`app/model.py`](app/model.py). Each branch returns a list of
`(PredictionResult, score)` tuples matching the Label Studio result schema.
The rest of the pipeline — XML parsing, HTTP plumbing, auth, health probes —
stays the same.
