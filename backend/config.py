"""Shared backend configuration for Hongseong Mate (홍성메이트)."""

from __future__ import annotations

import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SEED_DATA_PATH = PROJECT_ROOT / "frontend" / "seed-data" / "hongseong-mate-m3-seed.synthetic.json"
API_PREFIX = "/api/v1"
# 구옥 스테이 위치가 아직 정해지지 않아 비워둡니다. 위치가 정해지면 .env에
# HONGSEONG_MATE_LATITUDE / HONGSEONG_MATE_LONGITUDE 값을 넣어주세요 (예: "36.6009").
_lat = os.getenv("HONGSEONG_MATE_LATITUDE", "").strip()
_lng = os.getenv("HONGSEONG_MATE_LONGITUDE", "").strip()
HONGSEONG_MATE_LATITUDE = float(_lat) if _lat else None
HONGSEONG_MATE_LONGITUDE = float(_lng) if _lng else None
SERVICE_RADIUS_METERS = 2_000
KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY", "").strip()
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:8501,http://127.0.0.1:8501,http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
