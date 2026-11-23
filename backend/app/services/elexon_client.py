"""Client for the Elexon BMRS API (FUELHH actuals, WINDFOR forecasts)."""

from datetime import date, datetime, time, timedelta

import httpx

from app.config import (
    ACTUALS_TIMEOUT_SECONDS,
    ELEXON_BASE_URL,
    FORECASTS_TIMEOUT_SECONDS,
)


async def _stream_dataset(dataset: str, params: dict, timeout: float) -> list[dict]:
    """Fetch a streaming dataset and return its records as a list."""
    url = f"{ELEXON_BASE_URL}/datasets/{dataset}/stream"

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()

    payload = response.json()

    # `/stream` returns either a bare list or a {"data": [...]} envelope.
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        return payload.get("data", [])
    return []


async def get_wind_actuals(start_date: date, end_date: date) -> list[dict]:
    """Return half-hourly wind generation actuals for the inclusive date range."""
    return await _stream_dataset(
        "FUELHH",
        {
            "settlementDateFrom": start_date.isoformat(),
            "settlementDateTo": end_date.isoformat(),
            "fuelType": "WIND",
        },
        timeout=ACTUALS_TIMEOUT_SECONDS,
    )


async def get_wind_forecasts(start_date: date, end_date: date) -> list[dict]:
    """Return forecasts published from two days before ``start_date`` onwards."""
    publish_from = (
        datetime.combine(start_date, time.min) - timedelta(days=2)
    ).strftime("%Y-%m-%dT00:00:00Z")
    publish_to = f"{end_date.isoformat()}T23:59:59Z"

    return await _stream_dataset(
        "WINDFOR",
        {
            "publishDateTimeFrom": publish_from,
            "publishDateTimeTo": publish_to,
        },
        timeout=FORECASTS_TIMEOUT_SECONDS,
    )
