"""Client for the Elexon BMRS API.

Only two datasets are needed by the portal:

* ``FUELHH``  - half-hourly generation by fuel type (we use wind actuals).
* ``WINDFOR`` - wind generation forecasts, each row carrying the time it was
  published so we can pick the "day ahead" forecast.

Both endpoints share the same request/response plumbing, which lives in
:func:`_stream_dataset`.
"""

from datetime import date, datetime, time, timedelta

import httpx

from app.config import (
    ACTUALS_TIMEOUT_SECONDS,
    ELEXON_BASE_URL,
    FORECASTS_TIMEOUT_SECONDS,
)


async def _stream_dataset(dataset: str, params: dict, timeout: float) -> list[dict]:
    """Fetch a streaming dataset from Elexon and return its records as a list.

    Raises ``httpx.HTTPStatusError`` for 4xx/5xx responses and
    ``httpx.RequestError`` for connection problems; the API layer turns both
    into a 502 for the caller.
    """
    url = f"{ELEXON_BASE_URL}/datasets/{dataset}/stream"

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()

    payload = response.json()

    # `/stream` normally returns a bare list, but some responses wrap the
    # records in a {"data": [...]} envelope. Accept both shapes.
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
    """Return wind generation forecasts published around the date range.

    Forecasts can be published a couple of days before the period they
    describe, so the publish window starts two days before ``start_date``.
    """
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
