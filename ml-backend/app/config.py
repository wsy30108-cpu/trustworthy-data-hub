"""Runtime configuration for the Label Studio ML backend."""

from __future__ import annotations

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    ml_host: str = "0.0.0.0"
    ml_port: int = 9090
    model_version: str = "pre-label-v1"

    label_studio_url: Optional[str] = None
    label_studio_api_key: Optional[str] = None

    ml_shared_secret: Optional[str] = None


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
