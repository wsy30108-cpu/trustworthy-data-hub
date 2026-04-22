"""Integration tests for the Label Studio ML backend HTTP protocol."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


TEXT_CLASSIFICATION_CONFIG = """
<View>
  <Text name="txt" value="$text"/>
  <Choices name="sentiment" toName="txt" choice="single">
    <Choice value="Positive"/>
    <Choice value="Neutral"/>
    <Choice value="Negative"/>
  </Choices>
</View>
"""


NER_CONFIG = """
<View>
  <Labels name="ner" toName="txt">
    <Label value="EMAIL" background="#ff6"/>
    <Label value="PHONE" background="#6ff"/>
    <Label value="URL"   background="#f6f"/>
  </Labels>
  <Text name="txt" value="$text"/>
</View>
"""


IMAGE_CONFIG = """
<View>
  <Image name="img" value="$image"/>
  <RectangleLabels name="rect" toName="img">
    <Label value="Person"/>
    <Label value="Car"/>
  </RectangleLabels>
</View>
"""


def test_health_ok():
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "UP"
    assert body["model_loaded"] is True
    assert "model_version" in body


def test_setup_ok():
    resp = client.post("/setup", json={"project": "1", "hostname": "http://ls"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_predict_text_classification_positive():
    resp = client.post("/predict", json={
        "tasks": [{"id": 1, "data": {"text": "This is a great and wonderful product, I love it!"}}],
        "label_config": TEXT_CLASSIFICATION_CONFIG,
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["model_version"]
    assert len(body["results"]) == 1
    pred = body["results"][0]
    assert pred["result"], "expected at least one region"
    region = pred["result"][0]
    assert region["from_name"] == "sentiment"
    assert region["type"] == "choices"
    assert region["value"]["choices"][0] == "Positive"


def test_predict_text_classification_negative():
    resp = client.post("/predict", json={
        "tasks": [{"id": 2, "data": {"text": "terrible experience, awful and broken"}}],
        "label_config": TEXT_CLASSIFICATION_CONFIG,
    })
    body = resp.json()
    assert body["results"][0]["result"][0]["value"]["choices"][0] == "Negative"


def test_predict_ner_spans():
    text = "Contact me at alice@example.com or +1 415 555 1234, visit https://openai.com"
    resp = client.post("/predict", json={
        "tasks": [{"id": 3, "data": {"text": text}}],
        "label_config": NER_CONFIG,
    })
    body = resp.json()
    regions = body["results"][0]["result"]
    labels = {r["value"]["labels"][0] for r in regions}
    assert "EMAIL" in labels
    assert "URL" in labels
    for r in regions:
        v = r["value"]
        assert text[v["start"]:v["end"]] == v["text"]


def test_predict_image_rectangle():
    resp = client.post("/predict", json={
        "tasks": [{"id": 4, "data": {"image": "https://example.com/cat.jpg"}}],
        "label_config": IMAGE_CONFIG,
    })
    body = resp.json()
    region = body["results"][0]["result"][0]
    assert region["type"] == "rectanglelabels"
    assert region["value"]["rectanglelabels"]
    for k in ("x", "y", "width", "height"):
        assert 0 <= region["value"][k] <= 100


def test_predict_batch():
    resp = client.post("/predict", json={
        "tasks": [
            {"id": 10, "data": {"text": "good"}},
            {"id": 11, "data": {"text": "bad"}},
            {"id": 12, "data": {"text": "ok"}},
        ],
        "label_config": TEXT_CLASSIFICATION_CONFIG,
    })
    body = resp.json()
    assert len(body["results"]) == 3


def test_webhook_accepts_event():
    resp = client.post("/webhook", json={
        "action": "ANNOTATION_CREATED",
        "annotation": {"id": 1},
        "task": {"id": 1},
    })
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_train_returns_noop():
    resp = client.post("/train", json={"project": 1})
    assert resp.status_code == 200
    assert resp.json()["status"] == "training_noop"


def test_versions_endpoint():
    resp = client.get("/versions")
    body = resp.json()
    assert "versions" in body
    assert body["latest"] == body["versions"][0]


def test_metrics_counters_increment():
    before = client.get("/metrics").json()["counters"]["predict_calls"]
    client.post("/predict", json={"tasks": [{"id": 99, "data": {"text": "hi"}}],
                                    "label_config": TEXT_CLASSIFICATION_CONFIG})
    after = client.get("/metrics").json()["counters"]["predict_calls"]
    assert after == before + 1
