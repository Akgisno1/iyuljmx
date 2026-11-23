"""Central configuration for the backend.

Everything that can vary between environments (local machine, Docker, Vercel)
lives here so it can be found and changed in one place instead of being
repeated across routes and services.

Values are read from environment variables, falling back to safe defaults that
keep local development working out of the box.
"""

import os
from datetime import date

from dotenv import load_dotenv

# Load a local `.env` file if one is present. In production the platform
# injects real environment variables and this call does nothing.
load_dotenv()

# Elexon BMRS (Balancing Mechanism Reporting Service) API root.
ELEXON_BASE_URL = os.getenv(
    "ELEXON_BASE_URL",
    "https://data.elexon.co.uk/bmrs/api/v1",
)

# Browser origins allowed to call this API. Comma-separated, for example:
#   ALLOWED_ORIGINS=http://localhost:5173,https://my-app.vercel.app
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

# Any Vercel preview deployment is also allowed (e.g. my-app-git-branch.vercel.app).
ALLOWED_ORIGIN_REGEX = r"https://.*\.vercel\.app"

# Date window used when a request does not supply start_date / end_date.
DEFAULT_START_DATE = date(2026, 1, 1)
DEFAULT_END_DATE = date(2026, 1, 31)

# Network timeouts (seconds). Forecast payloads are much larger than the
# half-hourly actuals, so they get a more generous limit.
ACTUALS_TIMEOUT_SECONDS = 30.0
FORECASTS_TIMEOUT_SECONDS = 45.0
