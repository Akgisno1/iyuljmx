"""Pick one forecast value per delivery slot (the "day ahead" forecast)."""

from datetime import datetime, timedelta

from app.utils.time import to_naive_utc


def select_day_ahead_forecasts(
    forecasts: list[dict],
    cutoff_hours_before: int = 1,
) -> dict[str, float]:
    """Return the latest forecast per slot that was published far enough ahead.

    A forecast counts as "day ahead" for a slot when it was published at least
    ``cutoff_hours_before`` hours before midnight UTC of the day the slot
    belongs to. When several qualifying forecasts exist for the same slot, the
    most recently published one wins.

    Args:
        forecasts: Raw WINDFOR rows from Elexon.
        cutoff_hours_before: How many hours before the delivery day the
            forecast must have been published. ``0`` accepts any forecast.

    Returns:
        Mapping of naive-UTC slot timestamp (ISO string) to generation in MW.
    """
    latest_publish_by_slot: dict[str, datetime] = {}
    selected: dict[str, float] = {}

    for row in forecasts:
        if (
            not row.get("startTime")
            or not row.get("publishTime")
            or row.get("generation") is None
        ):
            continue

        slot_start = to_naive_utc(row["startTime"])
        published_at = to_naive_utc(row["publishTime"])
        slot = slot_start.isoformat()

        day_start = datetime(slot_start.year, slot_start.month, slot_start.day)
        cutoff = day_start - timedelta(hours=cutoff_hours_before)

        is_eligible = published_at <= cutoff
        is_newer = (
            slot not in latest_publish_by_slot
            or published_at > latest_publish_by_slot[slot]
        )

        if is_eligible and is_newer:
            latest_publish_by_slot[slot] = published_at
            selected[slot] = float(row["generation"])

    return selected
