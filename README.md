# UK Wind Forecast Portal

A small web app for UK energy analysts: a React frontend and a FastAPI backend that shows the health status of the API and, next, UK wind generation forecast data.

**Live version**

- Frontend: https://uk-wind-dashboard-rhyi.vercel.app
- Backend API: https://uk-wind-dashboard-ochre.vercel.app/api/health
- API docs: https://uk-wind-dashboard-ochre.vercel.app/docs

---

## Stack

| Part | Tech |
|---|---|
| Frontend | React 19 + Vite, served by nginx in Docker |
| Backend | FastAPI + uvicorn (Python 3.14) |
| Local run | Docker / docker compose |
| Deploy | Two Vercel projects (one for `backend/`, one for `frontend/`) |

---

## Project structure

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py          # FastAPI app, CORS, request logging, /api/health
│   ├── .dockerignore
│   ├── Dockerfile           # python:3.14-slim + uvicorn on port 8000
│   └── requirements.txt     # fastapi, uvicorn, httpx
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # calls `${VITE_API_URL}/api/health`
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── .dockerignore
│   ├── Dockerfile           # builds with Vite, serves dist/ with nginx
│   ├── index.html
│   ├── nginx.conf           # serves the app, proxies /api/ to backend:8000
│   ├── package.json
│   └── vite.config.js       # dev proxy /api -> http://localhost:8000
├── docker-compose.yml       # backend :8000 + frontend :5173
├── .gitignore
└── README.md
```

---

## Run locally with Docker (recommended)

Needs only Docker Desktop (or Docker Engine + compose plugin).

```bash
git clone https://github.com/Akgisno1/uk-wind-dashboard.git
cd uk-wind-dashboard
docker compose up --build
```

Then open:

- Frontend: <http://localhost:5173> → shows **Backend status: ok**
- Backend health: <http://localhost:8000/api/health> → `{"status":"ok"}`
- Backend docs: <http://localhost:8000/docs>

No environment variables are needed for this path: the frontend calls relative `/api/...` and nginx forwards those calls to the `backend` container, so everything is same-origin.

Stop with `Ctrl+C`, or `docker compose down`.

---

## Run locally without Docker

Two terminals.

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

Open <http://localhost:5173>. Vite proxies `/api` to `http://localhost:8000` (see `frontend/vite.config.js`), so no env var is needed here either.

---

## Environment variables

| Variable | Where | Purpose | Default |
|---|---|---|---|
| `VITE_API_URL` | frontend (Vercel only) | Absolute backend URL used by the browser. No trailing slash. | empty → relative `/api` |
| `ALLOWED_ORIGINS` | backend (Vercel) | Comma-separated extra CORS origins. `https://*.vercel.app` is always allowed. | `http://localhost:5173` |

> `VITE_API_URL` is baked in at **build** time. If you change it in Vercel, redeploy the frontend — restarting is not enough. A trailing slash would produce `//api/health`, which Vercel redirects without CORS headers, so the browser fetch would fail.

---

## API

| Method | Path | Response |
|---|---|---|
| GET | `/api/health` | `{"status": "ok"}` |

Interactive docs: `/docs`. Every request is logged to stdout, e.g.

```
2026-11-12 03:08:26,515 | INFO | GET /api/health -> 200 (99.6 ms) origin=https://uk-wind-dashboard-rhyi.vercel.app
```

Locally that appears in the uvicorn terminal; on Vercel it is under the backend project → **Logs**.

---

## Deployment

Two separate Vercel projects from the same repo:

1. **Backend** — root directory `backend`, Python runtime. Vercel installs `requirements.txt` and runs the ASGI `app` as a serverless function.
2. **Frontend** — root directory `frontend`, framework Vite. Set `VITE_API_URL` to the backend URL (no trailing slash), then redeploy.

Docker is **not** used by Vercel — Vercel never reads a Dockerfile. The Dockerfiles exist so the whole app can be run with one command on any machine, exactly as described above. Compared with Vercel, only two things differ: routing (`/api` goes through nginx locally, directly to the backend URL in production) and process lifetime (long-running container vs serverless function).

To redeploy after a code change: push to `master`; both Vercel projects rebuild automatically.

---

## AI tools used

- **Codebuff (AI coding agent)** — project scaffold, Dockerfiles, CORS configuration, request logging, README, and the fix for the CORS/redirect issue.
- **ChatGPT discussions** — background research on the Elexon API and data shaping.

All code was reviewed, run locally, and verified with live requests before being committed.
