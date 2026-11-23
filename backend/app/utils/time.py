"""Timestamp helpers shared by the Elexon services."""

from datetime import datetime, timezone


def to_naive_utc(iso_string: str) -> datetime:
    """Convert an ISO-8601 timestamp to a naive (timezone-free) UTC datetime."""
    parsed = datetime.fromisoformat(iso_string.replace("Z", "+00:00"))

    # Shift to UTC before dropping tzinfo, or an offset would be read as UTC.
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)

    return parsed
