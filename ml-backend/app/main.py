"""FastAPI app exposing the Label Studio ML backend HTTP protocol.

Implements the endpoints Label Studio expects when you register an ML backend
under Project -> Settings -> Model:

  GET  /                -> simple info page
  GET  /health          -> health probe (also used by LS "Validate and save")
  POST /setup           -> LS sends project info on backend connect
  POST /predict         -> LS asks for predictions (batched tasks)
  POST /webhook         -> LS fires annotation events (used for online training)
  POST /train           -> stub so LS's "Start training" button works
  GET  /versions        -> returns the list of model versions
  GET  /metrics         -> trivial counters
"""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

from .config import Settings, get_settings
from .model import PreLabelingModel
from .schemas import (
    HealthResponse,
    PredictRequest,
    PredictResponse,
    SetupRequest,
    WebhookRequest,
)

logger = logging.getLogger("ml-backend")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


def _build_app() -> FastAPI:
    settings = get_settings()
    model = PreLabelingModel(model_version=settings.model_version)

    app = FastAPI(
        title="Label Studio Pre-labeling ML Backend",
        description=(
            "A pre-labeling model service that speaks the Label Studio ML "
            "backend protocol. Register this URL under your Label Studio "
            "project's 'Model' settings."
        ),
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.state.start_ts = time.time()
    app.state.counters: Dict[str, int] = {
        "predict_calls": 0,
        "predict_tasks": 0,
        "setup_calls": 0,
        "train_calls": 0,
        "webhook_events": 0,
    }
    app.state.model = model
    app.state.settings = settings

    # -------- auth dependency --------
    def verify_token(
        authorization: Optional[str] = Header(default=None),
        x_ml_token: Optional[str] = Header(default=None, alias="X-ML-Token"),
    ) -> None:
        expected = settings.ml_shared_secret
        if not expected:
            return
        token = None
        if authorization and authorization.lower().startswith("token "):
            token = authorization.split(" ", 1)[1].strip()
        elif authorization and authorization.lower().startswith("bearer "):
            token = authorization.split(" ", 1)[1].strip()
        token = token or x_ml_token
        if token != expected:
            raise HTTPException(status_code=401, detail="invalid ml token")

    # -------- routes --------
    @app.get("/", response_class=HTMLResponse, include_in_schema=False)
    async def root() -> str:
        return f"""
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Label Studio ML Backend</title>
    <style>
      body {{ font-family: -apple-system, Segoe UI, Roboto, sans-serif;
             max-width: 720px; margin: 40px auto; padding: 0 20px; color: #1f2937; }}
      h1 {{ color: #4f46e5; }}
      code {{ background:#f3f4f6; padding: 2px 6px; border-radius: 4px; }}
      .pill {{ background:#dbeafe; color:#1d4ed8; padding:2px 10px;
              border-radius:999px; font-size:12px; }}
      ul {{ line-height: 1.8; }}
    </style>
  </head>
  <body>
    <h1>Label Studio ML Backend <span class="pill">UP</span></h1>
    <p>Model version: <code>{settings.model_version}</code></p>
    <p>Register this backend in Label Studio under
       <em>Project &rarr; Settings &rarr; Model &rarr; Connect Model</em>
       with URL <code>http://&lt;this-host&gt;:{settings.ml_port}</code>.</p>
    <h3>Endpoints</h3>
    <ul>
      <li><code>GET  /health</code> &mdash; health probe</li>
      <li><code>POST /setup</code> &mdash; Label Studio connect handshake</li>
      <li><code>POST /predict</code> &mdash; batch prediction</li>
      <li><code>POST /webhook</code> &mdash; annotation event sink</li>
      <li><code>POST /train</code> &mdash; training trigger (stub)</li>
      <li><code>GET  /versions</code></li>
      <li><code>GET  /metrics</code></li>
      <li><code>GET  /docs</code> &mdash; OpenAPI / Swagger UI</li>
    </ul>
  </body>
</html>
"""

    @app.get("/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        return HealthResponse(
            status="UP",
            model_version=settings.model_version,
            model_loaded=True,
            uptime_seconds=round(time.time() - app.state.start_ts, 3),
        )

    @app.post("/setup")
    async def setup(
        payload: SetupRequest,
        _: None = Depends(verify_token),
    ) -> Dict[str, Any]:
        app.state.counters["setup_calls"] += 1
        logger.info(
            "setup: project=%s hostname=%s",
            payload.project, payload.hostname,
        )
        return {
            "model_version": settings.model_version,
            "status": "ok",
        }

    @app.post("/predict", response_model=PredictResponse)
    async def predict(
        payload: PredictRequest,
        _: None = Depends(verify_token),
    ) -> PredictResponse:
        tasks = payload.tasks or []
        app.state.counters["predict_calls"] += 1
        app.state.counters["predict_tasks"] += len(tasks)
        logger.info("predict: tasks=%d", len(tasks))

        predictions = model.predict(tasks=tasks, label_config=payload.label_config)
        return PredictResponse(
            results=predictions,
            model_version=settings.model_version,
        )

    @app.post("/webhook")
    async def webhook(
        payload: WebhookRequest,
        _: None = Depends(verify_token),
    ) -> Dict[str, str]:
        app.state.counters["webhook_events"] += 1
        logger.info("webhook: action=%s", payload.action)
        return {"status": "ok"}

    @app.post("/train")
    async def train(
        request: Request,
        _: None = Depends(verify_token),
    ) -> Dict[str, Any]:
        body = {}
        try:
            body = await request.json()
        except Exception:
            pass
        app.state.counters["train_calls"] += 1
        logger.info("train: payload_keys=%s", list(body.keys()))
        # The rule-based engine has nothing to train, but we return a well-formed
        # reply so Label Studio's "Start training" button doesn't show an error.
        return {
            "status": "training_noop",
            "message": "Rule-based pre-labeling model: nothing to train.",
            "model_version": settings.model_version,
        }

    @app.get("/versions")
    async def versions() -> Dict[str, Any]:
        return {
            "versions": [settings.model_version],
            "latest": settings.model_version,
        }

    @app.get("/metrics")
    async def metrics() -> Dict[str, Any]:
        return {
            "uptime_seconds": round(time.time() - app.state.start_ts, 3),
            "counters": dict(app.state.counters),
            "model_version": settings.model_version,
        }

    # LS sometimes pings unknown paths during setup; return a clean 404 JSON.
    @app.exception_handler(HTTPException)
    async def http_exception_handler(  # type: ignore[override]
        _request: Request, exc: HTTPException,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"status": "error", "detail": exc.detail},
        )

    return app


app = _build_app()


def main() -> None:  # pragma: no cover - CLI entry
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.ml_host,
        port=settings.ml_port,
        reload=False,
    )


if __name__ == "__main__":  # pragma: no cover
    main()
