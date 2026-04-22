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
