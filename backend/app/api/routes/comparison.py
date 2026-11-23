"""Endpoint comparing wind generation actuals against day-ahead forecasts."""

import asyncio
from datetime import date

from fastapi import APIRouter, Query

from app.api.deps import ensure_valid_date_range
from app.config import DEFAULT_END_DATE, DEFAULT_START_DATE
from app.services.comparator import compare_actuals_and_forecasts
from app.services.elexon_client import get_wind_actuals, get_wind_forecasts
from app.services.forecast_selector import select_day_ahead_forecasts

router = APIRouter(tags=["comparison"])


@router.get("/comparison/wind")
async def wind_comparison(
    start_date: date = Query(default=DEFAULT_START_DATE),
    end_date: date = Query(default=DEFAULT_END_DATE),
    cutoff_hours_before: int = Query(default=1, ge=0, le=48),
):
    """Compare actual wind generation with the forecast known ahead of time."""
    ensure_valid_date_range(start_date, end_date)

    # The two Elexon calls are independent, so fetch them concurrently.
    actuals, forecasts = await asyncio.gather(
        get_wind_actuals(start_date, end_date),
        get_wind_forecasts(start_date, end_date),
    )

    selected = select_day_ahead_forecasts(forecasts, cutoff_hours_before)
    result = compare_actuals_and_forecasts(actuals, selected)

    result["actuals_fetched"] = len(actuals)
    result["forecasts_fetched"] = len(forecasts)
    result["forecasts_selected"] = len(selected)
    return result
