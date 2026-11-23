# Backend refactor — what changed and why

This document explains the restructuring of the `backend/` folder. The API
contract is unchanged: the three endpoints keep the same paths, query
parameters and JSON response shapes, so the frontend needed no changes.

---

## 1. What the backend does (short version)

The service is a thin read-only proxy over the **Elexon BMRS API** for UK wind
generation data. It exposes three endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /actuals/wind` | Half-hourly **measured** wind generation (`FUELHH` dataset). |
| `GET /forecasts/wind` | Raw **forecast** rows (`WINDFOR` dataset), each with the time it was published. |
| `GET /comparison/wind` | Picks one "day-ahead" forecast per half-hour slot, pairs it with the actual value and returns per-slot errors plus the MAE. |
| `GET /health` | Liveness probe. |

Request flow:

```
routes (HTTP: validation, shaping)
   └── services (business logic)
         ├── elexon_client       -> talks to data.elexon.co.uk
         ├── forecast_selector   -> chooses the day-ahead forecast per slot
         └── comparator          -> pairs actuals/forecasts, computes MAE
   └── utils / config (shared helpers and settings)
```

---

## 2. New folder layout

```
backend/app/
├── main.py                     # FastAPI app: CORS, routers, error handlers, /health
├── config.py                   # NEW — all env-driven settings and defaults
├── api/
│   ├── deps.py                 # NEW — shared date-range validation
│   └── routes/
│       ├── actuals.py
│       ├── forecasts.py
│       └── comparison.py
├── services/
│   ├── elexon_client.py        # merged: was elexon_client.py + elexon_forecast_client.py
│   ├── forecast_selector.py    # single source of truth for the "day ahead" pick
│   └── comparator.py
└── utils/
    └── time.py                 # NEW — single to_naive_utc() helper
```

Removed:

* `app/functions/to_naive_utc.py` — replaced by `app/utils/time.py`.
* `app/services/elexon_forecast_client.py` — merged into `elexon_client.py`.
* `app/services/forecast_selector.py`'s duplicate implementation inside
  `elexon_forecast_client.py` — the module is now the only copy.

Also added `__init__.py` to every package so the layout is explicit instead of
relying on namespace packages.

---

## 3. Duplication that was removed

### 3.1 Two copies of the UTC conversion helper
`to_naive_utc` / `convert_to_standard_time` existed **twice**, once privately
inside `elexon_forecast_client.py` and once in `app/functions/`. Both copies are
now one function, `app.utils.time.to_naive_utc()`.

**Bug fixed while consolidating:** the `app/functions` version was

```python
datetime.fromisoformat(iso_str.replace("Z", "+00:00")).replace(tzinfo=None)
```

It dropped the timezone **without** converting first, so any timestamp with a
non-zero offset (e.g. `+01:00`) was compared as if it were already UTC — off by
up to an hour, which could mis-align actuals against forecasts. The single
helper now converts with `astimezone(timezone.utc)` before stripping `tzinfo`.

### 3.2 Two copies of the day-ahead forecast selector
`select_day_ahead_forecasts` was copy-pasted in `forecast_selector.py` and
`elexon_forecast_client.py`. The copy in `forecast_selector.py` was dead code.
The logic now lives only in `services/forecast_selector.py`, with the same
behaviour (latest publish that is at least `cutoff_hours_before` hours before
midnight UTC of the delivery day).

### 3.3 Two copies of the Elexon HTTP call
Both datasets used the same `httpx.AsyncClient(...) → get → raise_for_status →
json()` block. A private `_stream_dataset(dataset, params, timeout)` helper now
performs the request, normalises the response to a list (bare list **or**
`{"data": [...]}` envelope) and is shared by `get_wind_actuals` and
`get_wind_forecasts`.

### 3.4 Repeated `try/except` in every route
All three routes had identical `httpx.HTTPStatusError` / `httpx.RequestError`
handlers. Those are now two exception handlers in `main.py`, so routes contain
only their business logic. Response details are now consistent:
* upstream HTTP error → `502` + `"Elexon returned HTTP <code>"`
* connection/timeout → `502` + `"Could not connect to the Elexon API"`

### 3.5 Repeated date-range validation
`if start_date > end_date: raise HTTPException(400, ...)` appeared in all three
routes. It is now `app.api.deps.ensure_valid_date_range()` with the identical
message: `"start_date must be before or equal to end_date"`.

### 3.6 Repeated default dates
The hardcoded `date(2026, 1, 1)` / `date(2026, 1, 31)` defaults were repeated in
each route. They live in `app.config.DEFAULT_START_DATE` / `DEFAULT_END_DATE`
and are used by all three routes.

---

## 4. Other improvements

* **Configuration in one place** — `app/config.py` holds `ELEXON_BASE_URL`,
  allowed CORS origins, allowed-origin regex, default dates and the two HTTP
  timeouts (30 s actuals / 45 s forecasts, unchanged).
* **`load_dotenv()` moved out of `main.py`** — it now runs in `config.py`,
  before any setting is read, so imports are no longer split by it (the old
  `main.py` had a statement between imports, which breaks import ordering).
* **Parallel fetching in `/comparison/wind`** — actuals and forecasts are
  independent requests, so they now run concurrently with `asyncio.gather`.
  The endpoint returns the same JSON; it just makes two round-trips at once.
* **Type hints and docstrings everywhere** — every module, public function and
  endpoint explains what it takes, returns and assumes, so a new developer can
  follow the flow without reverse-engineering it.
* **Meaningful internal names** — e.g. `start_dt`/`pub_dt`/`best_publish`
  became `slot_start`/`published_at`/`latest_publish_by_slot`; `mae` is computed
  as `mean_absolute_error` before being returned under its original key.
* **Simpler conditionals** — the nested `if x and (a or b)` in the selector is
  split into named booleans (`is_eligible`, `is_newer`), which reads as the
  rule it implements.
* **API docs metadata** — the app has a description/version and each router a
  tag, so `/docs` is easier to navigate. No paths changed.

### `requirements.txt`

* Was **UTF-16 encoded with a BOM**, which some tools (including `pip` on some
  platforms and Docker layers) misread. It is now plain UTF-8/ASCII.
* Trimmed from 25 packages to the 4 the backend actually imports:
  `fastapi`, `uvicorn`, `httpx`, `python-dotenv`. Removed entries (`numpy`,
  `pandas`, `openai`, `starlette`, `pydantic`, …) are transitive dependencies
  or unused — restore any of them if a future feature needs them explicitly.

---

## 5. How to run

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: <http://localhost:8000/docs>

Environment variables (all optional):

| Variable | Default | Meaning |
| --- | --- | --- |
| `ELEXON_BASE_URL` | `https://data.elexon.co.uk/bmrs/api/v1` | Elexon API root. |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated CORS origins. |

---

## 6. How this was verified

Nothing was tested against the live Elexon API. Checks performed:

1. `python -m compileall app` — every module compiles.
2. An offline script (removed afterwards) asserted:
   * `to_naive_utc` for `Z`, `+01:00` and naive inputs;
   * the selector's cutoff rule, "latest eligible publish wins" rule and its
     handling of malformed rows;
   * the comparator's pairing, skipped slots, rounding and MAE;
   * all three endpoints + `/health` through FastAPI's `TestClient` with the
     Elexon calls stubbed, including the exact JSON body of `/comparison/wind`;
   * `400` for an inverted date range, and `502` for both upstream HTTP and
     connection errors.
3. Started `uvicorn app.main:app` for real and confirmed `/health` → 200,
   an inverted range → 400, and `/docs` → 200.
