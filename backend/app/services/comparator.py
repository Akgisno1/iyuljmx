"""Compare measured wind generation with the day-ahead forecast."""

from app.utils.time import to_naive_utc


def compare_actuals_and_forecasts(
    actuals: list[dict],
    selected_forecasts: dict[str, float],
) -> dict:
    """Pair each actual with its forecast and summarise the error.

    ``error = forecast - actual``; slots missing from either side are skipped.
    """
    comparisons: list[dict] = []
    absolute_errors: list[float] = []

    for row in actuals:
        if not row.get("startTime") or row.get("generation") is None:
            continue

        slot = to_naive_utc(row["startTime"]).isoformat()
        if slot not in selected_forecasts:
            continue

        actual = float(row["generation"])
        forecast = selected_forecasts[slot]
        error = forecast - actual

        absolute_errors.append(abs(error))
        comparisons.append(
            {
                "startTime": slot,
                "actual": round(actual, 1),
                "forecast": round(forecast, 1),
                "error": round(error, 1),
            }
        )

    mean_absolute_error = (
        round(sum(absolute_errors) / len(absolute_errors), 1)
        if absolute_errors
        else 0.0
    )

    return {
        "mae": mean_absolute_error,
        "count": len(comparisons),
        "items": comparisons,
    }
