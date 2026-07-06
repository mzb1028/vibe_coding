"""
Food Lube CPG Intelligence Dashboard — API (Phase 1: mock data only).

DATA-SOURCE CONTRACT
--------------------
Every endpoint returns KPI objects with the exact shape defined in
shared/seed.json (id, name, department, scope, cadence, value, unit,
target, trend, confidence, source, note).

Phase 1 serves everything from the MOCK provider (shared/seed.json).
To wire a LIVE source in Phase 2/3, implement another provider class
with the same three methods and swap it in `get_provider()` — no route
or frontend code changes required.
"""
import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

SEED_PATH = Path(__file__).resolve().parent.parent / "shared" / "seed.json"

VALID_CADENCES = {"daily", "weekly", "monthly", "quarterly", "annual"}
VALID_SCOPES = {"I", "E"}


class MockProvider:
    """MOCK data provider — the only provider in Phase 1.

    LIVE providers (Phase 2: SEC/USPTO/FDA/etc.; Phase 3: Circana/ERP)
    must implement the same methods returning the same shapes.
    """

    def __init__(self, seed_path: Path):
        with open(seed_path) as f:
            self._seed = json.load(f)

    def company(self) -> dict:
        return self._seed["company"]

    def departments(self) -> list:
        return self._seed["departments"]

    def kpis(self, mode: str, department: Optional[str], cadence: Optional[str]) -> list:
        rows = self._seed["kpis"]
        if mode == "industry":
            # Industry mode never exposes internal-only KPIs.
            rows = [k for k in rows if k["scope"] == "E"]
        if department:
            rows = [k for k in rows if k["department"] == department]
        if cadence:
            rows = [k for k in rows if k["cadence"] == cadence]
        return rows

    def competitors(self) -> list:
        # Competitor cards are externally-observable [E] by construction;
        # enforce it anyway so a bad seed can never leak an [I] KPI.
        out = []
        for c in self._seed["competitors"]:
            out.append({**c, "kpis": [k for k in c["kpis"] if k["scope"] == "E"]})
        return out


def get_provider() -> MockProvider:
    """Swap point: return a LIVE provider here when real sources exist."""
    return MockProvider(SEED_PATH)


app = FastAPI(title="Food Lube CPG Intelligence API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to the frontend origin in production
    allow_methods=["GET"],
    allow_headers=["*"],
)
provider = get_provider()


@app.get("/api/health")
def health():
    return {"status": "ok", "data_source": "mock"}


@app.get("/api/company")
def company():
    return provider.company()


@app.get("/api/departments")
def departments():
    return provider.departments()


@app.get("/api/kpis")
def kpis(
    mode: str = Query("company", pattern="^(company|industry)$"),
    department: Optional[str] = None,
    cadence: Optional[str] = None,
):
    if cadence and cadence not in VALID_CADENCES:
        raise HTTPException(422, f"cadence must be one of {sorted(VALID_CADENCES)}")
    return provider.kpis(mode, department, cadence)


@app.get("/api/competitors")
def competitors():
    return provider.competitors()
