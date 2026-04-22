"""Pydantic schemas matching Label Studio's ML backend protocol.

Reference: https://labelstud.io/guide/ml_create and
           https://labelstud.io/api#tag/Machine-Learning
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ----- Incoming requests -----------------------------------------------------


class PredictRequest(BaseModel):
    """Payload Label Studio sends to `/predict`.

    Only the fields the backend actually reads are declared; everything else is
    preserved via `model_config` / extra="allow" to avoid breaking upgrades.
    """

    model_config = {"extra": "allow"}

    tasks: List[Dict[str, Any]] = Field(default_factory=list)
    label_config: Optional[str] = None
    project: Optional[str] = None
    params: Optional[Dict[str, Any]] = None


class SetupRequest(BaseModel):
    model_config = {"extra": "allow"}

    project: Optional[str] = None
    schema_: Optional[str] = Field(default=None, alias="schema")
    hostname: Optional[str] = None
    access_token: Optional[str] = None
    model_version: Optional[str] = None


class WebhookRequest(BaseModel):
    """Label Studio fires webhooks on annotation events; we accept them all."""

    model_config = {"extra": "allow"}

    action: Optional[str] = None
    project: Optional[Dict[str, Any]] = None
    annotation: Optional[Dict[str, Any]] = None
    task: Optional[Dict[str, Any]] = None


# ----- Outgoing predictions --------------------------------------------------


class PredictionResult(BaseModel):
    """A single annotation region inside a prediction."""

    model_config = {"extra": "allow"}

    from_name: str
    to_name: str
    type: str
    value: Dict[str, Any]
    id: Optional[str] = None
    score: Optional[float] = None


class Prediction(BaseModel):
    model_config = {"extra": "allow"}

    model_version: str
    score: float = 0.0
    result: List[PredictionResult] = Field(default_factory=list)


class PredictResponse(BaseModel):
    results: List[Prediction]
    model_version: str


class HealthResponse(BaseModel):
    status: str = "UP"
    model_version: str
    model_loaded: bool = True
    uptime_seconds: float
