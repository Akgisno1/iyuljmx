# UK Wind Forecast Portal

A pilot analysis of **day-ahead wind forecast accuracy** for Great Britain, built for the January 2026 window. The portal pairs every metered half-hourly wind output reading with the forecast that was actually available the day before, then shows where the forecast missed, which way it missed, and what that miss would have cost in backup capacity.

- **Frontend:** https://uk-wind-dashboard-1km7.vercel.app/
- **Backend API:** https://uk-wind-dashboard-ochre.vercel.app
- **API docs (Swagger):** https://uk-wind-dashboard-ochre.vercel.app/docs
- **Health check:** https://uk-wind-dashboard-ochre.vercel.app/health

---

## What the portal shows

Four views, one data load, shareable URLs (`#/overview`, `#/risk`, `#/log`, `#/methodology`):

| View | Question it answers |
|---|---|
| **Overview** | Did generation arrive where the forecast said it would, day by day? Delivered vs forecast chart (hourly/daily), MAE, backup needed, peak shortfall, mean bias, plus coverage, forecast lean and the worst day. |
| **Error & Risk** | What exposure did the forecast error create? Cover needed for 90% of periods, worst shortfall, periods more than 3 GW short, a cover curve, accuracy split by wind level, and the worst delivery days. |
| **Settlement Log** | Every matched half-hour period: forecast, delivered, error, absolute % error, filterable and sortable. |
| **Methodology** | Data sources, the forecast cutoff rule, metric definitions, and an honest statement of scope. |

A date picker (with presets) drives the query, and the header shows the date range currently on screen.

### January 2026, as measured by the app

| Metric | Value |
|---|---|
| Matched settlement periods | 744 of 1,488 half-hours (49.8%) |
| Mean absolute error | 1,919 MW — 17.9% of delivered wind |
| Mean bias (forecast − actual) | **+1,713 MW** (forecast runs high) |
| Periods over-forecast | 657 of 744 (88.3%) |
| Cover needed for 90% of periods (P90 shortfall) | 3,864 MW |
| Worst single shortfall | 7,305 MW |
| Periods more than 3 GW short | 142 (19.1%) |
| Delivered vs forecast energy | 4,308,174 MWh vs 4,945,538 MWh |

The headline finding: the error is **systematically one-sided**. Nearly nine periods in ten over-forecast, so the average miss is not noise you can net off — it is capacity you have to buy.

---

## Data and method

Both series come from the public **Elexon BMRS API** (`data.elexon.co.uk/bmrs/api/v1`):

- `FUELHH` — half-hourly metered wind generation (MW) for `WIND` fuel type.
- `WINDFOR` — wind generation forecasts, each row carrying `startTime` (the slot it is about) and `publishTime` (when it was issued).

**Forecast selection is the core rule.** For every delivery slot the backend keeps the latest forecast that was published at least `cutoff_hours_before` hours before **midnight UTC of the delivery day** (default 1 hour; the query parameter accepts 0–48). This is deliberately conservative: it guarantees the comparison never uses information that would not have existed when the decision was made. Using simply "the latest forecast" would leak look-ahead bias and flatter the accuracy.

Two consequences are stated in the UI rather than hidden:

- `WINDFOR` is hourly while `FUELHH` is half-hourly, so only on-the-hour slots match — hence 744 of 1,488 periods.
- `error = forecast − actual`, so a positive value means the forecast ran high (a shortfall risk), not a surplus.

---

## Architecture

```
Browser (React 19 + Vite + Tailwind v4 + shadcn/ui)
        │  GET /comparison/wind?start_date=…&end_date=…
        ▼
FastAPI  ── api/routes/comparison.py
        │
        ▼
services/elexon_client.py ──► https://data.elexon.co.uk/bmrs/api/v1  (httpx)
        │  actuals + forecasts, fetched concurrently
        ▼
services/forecast_selector.py  (pick day-ahead forecast per slot)
        ▼
services/comparator.py         (pair slots, error, MAE)
```

Layer responsibilities are strict: routes do HTTP and validation, services do the work, `config.py` holds every environment-driven value, `utils/time.py` normalises timestamps. Elexon failures (HTTP errors or connection problems) are translated once, in `main.py`, into `502` with a readable `detail`, so no route carries its own error handling.

**Cost of a request.** Every `/comparison/wind` call is computed from scratch: two concurrent Elexon calls (actuals + forecasts), the day-ahead selection, then the comparison. For a full month that is roughly 2–3 seconds, which is what the initial skeleton covers. Nothing is cached server-side, so results always reflect the current upstream data.

**Frontend.** `WindShell` owns fetching: an `AbortController` cancels the previous request when the date range changes (dragging the calendar fires many), the previous data stays on screen while a new range loads, and API errors surface with a retry. Data is exposed through one context so each tab computes its own view from the same payload; metric maths lives in `src/lib/wind.js` and nowhere else.

The UI is composed directly from shadcn primitives (`Card`, `Button`, `Tabs`, `Calendar`, `Skeleton`, `Chart`) and theme tokens (`bg-card`, `bg-muted`, `text-muted-foreground`, `border`, `bg-primary`) — no bespoke panel component, no gradient fills, no decorative badges. Numbers use `tabular-nums` so columns line up. The shell is a fixed viewport: 280 px sidebar, scrollable right pane; below `lg` the sidebar collapses and navigation moves to a tab strip.

**Deployment.** Two Vercel projects from one repo: `backend/` as a Python serverless function, `frontend/` as a static Vite build with `VITE_API_URL` pointing at the backend. Dockerfiles and `docker-compose.yml` exist for one-command local runs; Vercel does not use them.

---

## Stack

| Part | Tech |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Base UI), Recharts 3, react-day-picker, date-fns, oxlint |
| Backend | Python 3.14, FastAPI, uvicorn, httpx, python-dotenv |
| Data | Elexon BMRS (`FUELHH`, `WINDFOR`) |
| Local run | Docker Compose, or two terminals |
| Deploy | Vercel (two projects) |

---

## Repository layout

```
.
├── backend/
│   ├── app/
│   │   ├── main.py                  # app, CORS, routers, Elexon errors → 502, /health
│   │   ├── config.py                # env-driven settings, date defaults, timeouts
│   │   ├── api/
│   │   │   ├── deps.py              # date-range validation
│   │   │   └── routes/
│   │   │       ├── actuals.py       # GET /actuals/wind
│   │   │       ├── forecasts.py     # GET /forecasts/wind
│   │   │       └── comparison.py    # GET /comparison/wind
│   │   ├── services/
│   │   │   ├── elexon_client.py     # httpx calls, pagination, timeouts
│   │   │   ├── forecast_selector.py # day-ahead forecast rule
│   │   │   └── comparator.py        # slot pairing, error, MAE
│   │   └── utils/time.py            # timezone-safe parsing
│   ├── CHANGES.md                   # backend refactor notes
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # fetch + hash routing + abort control
│   │   ├── context/WindDataContext.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx  RightSide.jsx  KpiCard.jsx  TabSkeletons.jsx
│   │   │   ├── chart/OverviewArea.jsx  chart/ReserveCurve.jsx
│   │   │   ├── tabs/Overview.jsx  ErrorRisk.jsx  SettlementLog.jsx  Methodology.jsx
│   │   │   └── ui/                  # shadcn: button, card, calendar, tabs, skeleton, chart
│   │   └── lib/wind.js              # every metric in one place
│   ├── Dockerfile
│   ├── nginx.conf
│   └── vite.config.js               # @/ alias, Tailwind plugin
├── changes.md                       # risk view + UI change log
├── docker-compose.yml
└── README.md
```

---

## Run locally

### Docker (one command)

```bash
git clone https://github.com/Akgisno1/iyuljmx.git
cd iyuljmx
docker compose up --build
```

- Frontend: <http://localhost:5173>
- Backend docs: <http://localhost:8000/docs>
- Health: <http://localhost:8000/health>

No environment variables are needed: the browser calls `http://localhost:8000` directly and the backend's CORS default allows `http://localhost:5173`.

### Without Docker

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Each date-range change calls Elexon and recomputes, so expect a couple of seconds for a full month.

---

## Configuration

| Variable | Where | Purpose | Default |
|---|---|---|---|
| `VITE_API_URL` | frontend build env | Absolute backend URL, no trailing slash | `http://localhost:8000` |
| `ELEXON_BASE_URL` | backend | Elexon BMRS root | `https://data.elexon.co.uk/bmrs/api/v1` |
| `ALLOWED_ORIGINS` | backend | Comma-separated extra CORS origins; `https://*.vercel.app` is always allowed | `http://localhost:5173` |

`VITE_API_URL` is baked in at build time — changing it on Vercel requires a redeploy.

---

## API

| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/health` | — | `{"status":"ok"}` |
| GET | `/actuals/wind` | `start_date`, `end_date` | `{count, data[]}` — raw `FUELHH` rows |
| GET | `/forecasts/wind` | `start_date`, `end_date` | `{count, data[]}` — raw `WINDFOR` rows |
| GET | `/comparison/wind` | `start_date`, `end_date`, `cutoff_hours_before` (0–48) | `{mae, count, actuals_fetched, forecasts_fetched, forecasts_selected, items[]}` |

`items[]` is `{startTime, actual, forecast, error}` per matched half-hour, newest first, naive UTC.

---

## Verification

- `npm run build` passes; `npm run lint` reports 0 errors (3 `react-refresh/only-export-components` warnings inside shadcn `ui/` files).
- Figures cross-checked against the raw API response (MAE, bias, over-forecast count, P90, worst miss).
- Rendered and reviewed at 1440×900, 1280×800 and 900×900 for all four views; no clipping, tables scroll internally, charts sized.
- Error path: backend stopped shows the error card with retry; a failed refresh keeps the last good data with a banner.

No automated test suite yet — checks are lint, build and the manual/API verification above. That is the first thing to add.

---

## How AI was used

This project was built with AI assistance, and the brief asks for that to be stated plainly. The split was: **the AI wrote most of the code and prose; I set the problem, made the analytical and design decisions, reviewed every change, and verified the result against the live API.** Nothing was committed without being run.

### Understanding the assignment

AI was used as a thinking partner before any code existed: restating what the brief was really asking for, mapping the Elexon datasets (`FUELHH` vs `WINDFOR`, what `publishTime` makes possible), and explaining why "latest forecast" is the wrong comparison because it leaks look-ahead information. It also turned the vague parts into concrete acceptance checks — what counts as a match, what a "day-ahead" forecast means, how many periods can realistically be compared. I chose the final scope: January 2026, the 1-hour-before-midnight cutoff, four views, and the metrics that a buyer would act on.

### Backend

AI drafted the FastAPI structure — routes / services / config / utils separation, the `httpx` client with timeouts, the forecast selector, the comparator, CORS and the single 502 error handler. The parts I decided or pushed back on:

- The **cutoff rule** (published at least N hours before midnight UTC of the delivery day), which the AI implemented and I checked slot by slot.
- Structure and readability, since the backend is meant to be reviewed: docstrings, type hints, no business logic in routes.

### Frontend

AI wrote the React code: the fetch/abort logic, hash routing, the metric library, and every view. Two rounds of feedback shaped it. First, the initial UI looked generated — decorative gradients, icons in every card, pills, vw-scaled type. I asked for plain shadcn components and basic Tailwind only, and it was rewritten around `Card`, `Button`, `Tabs` and theme tokens. Second, the Error & Risk view repeated the Overview numbers; I asked what it should actually tell someone, which produced the exposure view (cover curve, accuracy by wind level, worst delivery days).

AI also found real bugs during those passes — items arriving newest-first so the chart ran backwards, naive UTC timestamps being read as local time, the shortfall sign being inverted (it was counting surplus as shortfall) — and fixed them once identified. I checked each fix in the running app rather than taking it on trust.

### What I did myself

- Set the requirements, scope, and the analytical definitions that everything else depends on.
- Chose the stack, the deployment shape (two Vercel projects), and the UX direction.
- Reviewed every diff; rejected and re-scoped work that did not meet the brief.
- Ran the app, compared the numbers against the API by hand, and worked through the error paths (bad dates, Elexon down).
- Wrote the final README structure and the review notes, and confirmed the figures quoted here.



### Tools

- **Codebuff** — the coding agent used for implementation, refactors and documentation.
- **ChatGPT** — background reading on the Elexon API and data-shaping questions.
