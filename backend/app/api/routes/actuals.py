"""Endpoint returning wind generation actuals from Elexon."""

from datetime import date

from fastapi import APIRouter, Query

from app.api.deps import ensure_valid_date_range
from app.config import DEFAULT_END_DATE, DEFAULT_START_DATE
from app.services.elexon_client import get_wind_actuals

router = APIRouter(tags=["actuals"])


@router.get("/actuals/wind")
async def wind_actuals(
    start_date: date = Query(default=DEFAULT_START_DATE),
    end_date: date = Query(default=DEFAULT_END_DATE),
):
    """Return half-hourly wind generation actuals for the given date range."""
    ensure_valid_date_range(start_date, end_date)

    data = await get_wind_actuals(start_date, end_date)
    return {"count": len(data), "data": data}
