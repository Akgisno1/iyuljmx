"""Small helpers shared by the API routes."""

from datetime import date

from fastapi import HTTPException


def ensure_valid_date_range(start_date: date, end_date: date) -> None:
    """Raise HTTP 400 when ``start_date`` is after ``end_date``."""
    if start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date must be before or equal to end_date",
        )
