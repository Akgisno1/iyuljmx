"""Environment-driven settings for the backend."""

import os
from datetime import date

from dotenv import load_dotenv

load_dotenv()

ELEXON_BASE_URL = os.getenv(
    "ELEXON_BASE_URL",
    "https://data.elexon.co.uk/bmrs/api/v1",
)

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

ALLOWED_ORIGIN_REGEX = r"https://.*\.vercel\.app"

DEFAULT_START_DATE = date(2026, 1, 1)
DEFAULT_END_DATE = date(2026, 1, 31)

ACTUALS_TIMEOUT_SECONDS = 30.0
FORECASTS_TIMEOUT_SECONDS = 45.0
