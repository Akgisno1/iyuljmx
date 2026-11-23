"""FastAPI application entrypoint for the UK Wind Forecast Portal."""

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.actuals import router as actuals_router
from app.api.routes.comparison import router as comparison_router
from app.api.routes.forecasts import router as forecasts_router
from app.config import ALLOWED_ORIGIN_REGEX, ALLOWED_ORIGINS

app = FastAPI(
    title="UK Wind Forecast Portal",
    description="Wind generation actuals, forecasts and day-ahead forecast accuracy.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(actuals_router)
app.include_router(forecasts_router)
app.include_router(comparison_router)


@app.exception_handler(httpx.HTTPStatusError)
async def elexon_status_error_handler(
    request: Request, exc: httpx.HTTPStatusError
) -> JSONResponse:
    """Report an upstream Elexon HTTP error (4xx/5xx) as a 502 Bad Gateway."""
    return JSONResponse(
        status_code=502,
        content={"detail": f"Elexon returned HTTP {exc.response.status_code}"},
    )


@app.exception_handler(httpx.RequestError)
async def elexon_connection_error_handler(
    request: Request, exc: httpx.RequestError
) -> JSONResponse:
    """Report a network/timeout failure while calling Elexon as a 502."""
    return JSONResponse(
        status_code=502,
        content={"detail": "Could not connect to the Elexon API"},
    )


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """Simple liveness probe used by hosting platforms and uptime checks."""
    return {"status": "ok"}
