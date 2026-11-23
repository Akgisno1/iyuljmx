"""Date/time helpers shared by the Elexon services.

Elexon timestamps look like ``2026-01-01T00:00:00Z`` (sometimes with a numeric
offset instead of ``Z``). To compare actuals against forecasts reliably we
convert every timestamp to naive UTC: the same instant, with the timezone
information stripped so the values are hashable and directly comparable.
"""

from datetime import datetime, timezone


def to_naive_utc(iso_string: str) -> datetime:
    """Convert an ISO-8601 timestamp to a naive (timezone-free) UTC datetime.

    Examples
    --------
    >>> to_naive_utc("2026-01-01T00:00:00Z")
    datetime.datetime(2026, 1, 1, 0, 0)
    >>> to_naive_utc("2026-01-01T01:00:00+01:00")
    datetime.datetime(2026, 1, 1, 0, 0)
    """
    parsed = datetime.fromisoformat(iso_string.replace("Z", "+00:00"))

    # An offset-aware value must be shifted to UTC *before* dropping tzinfo,
    # otherwise 01:00+01:00 would be treated as 01:00 UTC and be an hour off.
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)

    return parsed
