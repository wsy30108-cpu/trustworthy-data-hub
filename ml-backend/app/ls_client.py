"""Thin async Label Studio REST client.

Used when the backend needs to push predictions back to Label Studio
(for example, from a scheduled batch predict). For the normal "on-demand"
pre-labeling flow Label Studio drives the request, so this client is
optional.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger("ml-backend.ls")


class LabelStudioClient:
    def __init__(self, base_url: str, api_key: Optional[str]) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Token {self.api_key}"
        return headers

    async def list_tasks(self, project_id: int, page_size: int = 20) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/api/tasks"
        params = {"project": project_id, "page_size": page_size}
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url, params=params, headers=self._headers())
            resp.raise_for_status()
            data = resp.json()
            return data.get("tasks", data if isinstance(data, list) else [])

    async def create_prediction(
        self,
        task_id: int,
        result: List[Dict[str, Any]],
        model_version: str,
        score: float = 0.0,
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/api/predictions/"
        payload = {
            "task": task_id,
            "result": result,
            "model_version": model_version,
            "score": score,
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(url, json=payload, headers=self._headers())
            resp.raise_for_status()
            return resp.json()

    async def ping(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/version", headers=self._headers())
                return resp.status_code == 200
        except Exception as exc:
            logger.warning("label studio ping failed: %s", exc)
            return False
