# Food Lube — CPG Intelligence Dashboard

A two-mode intelligence dashboard for a food/beverage CPG operator:

- **My Company** — internal operating view of a functional food CPG
  (fictional demo profile: ≈$75M revenue, asset-light — co-manufacturer,
  3PL, broker-supported sales). 72 KPIs across 10 departments.
- **Industry** — external competitive-intelligence view of real soup/broth
  competitors, showing **only externally-observable [E] KPIs**.

Every KPI carries the same data contract:

```
{ id, name, department, scope ("I"|"E"), cadence, value, unit,
  target, trend[], confidence ("certain"|"likely"|"guessing"), source, note }
```

**Confidence coloring** (always on): certain → green, likely → yellow,
guessing → red. Hover any number for its confidence and source.

## Repo layout

```
shared/seed.json      SINGLE SOURCE OF TRUTH for all mock data
frontend/             React (Vite) app — dark theme, responsive
  src/data/index.js   the swappable data interface (mock | api)
  src/data/mock.js    mock provider (reads shared/seed.json)
  src/data/api.js     API provider (FastAPI backend)
backend/main.py       FastAPI service (serves the same seed; same contract)
render.yaml           Render deployment blueprint (static site + API)
index.html            the founder's command center (previous phase) —
                      preserved untouched; later becomes the LIVE [I] source
```

No numbers are hardcoded in components; everything flows through
`frontend/src/data/index.js`. Switch providers with `VITE_DATA_SOURCE=api`
and `VITE_API_BASE=<backend url>` — zero UI changes.

## Run locally

```
# frontend (mock mode — no backend needed)
cd frontend && npm install && npm run dev

# backend (optional in Phase 1)
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

## Deploy on Render (no coding required)

1. Render.com → New → **Blueprint** → select this GitHub repo.
2. Render reads `render.yaml` and creates both services (free tier).
3. To use API mode, set the static site's env var `VITE_DATA_SOURCE=api`
   and `VITE_API_BASE` to the API service URL, then redeploy.

## Daily log & derived KPIs

The **Daily log** (My Company → ✎ Daily log) takes raw, bottom-up facts —
raw material purchases, packaging, co-man fees, inbound/outbound freight,
storage/3PL, duties, marketing, trade promo, travel, payroll, R&D, legal,
equipment, sales (with units & channel), inventory counts, doors, orders,
customers, complaints — and files each automatically (COGS / Distribution /
OpEx / CapEx / Revenue / Inventory, owning department). derive.js then
computes KPIs from the entries (gross margin, cash, burn, runway, landed
cost/unit, freight & storage %% of revenue, CAC, marketing %% of revenue,
payroll %%, inventory value, operational counts) and overrides the demo
values — derived numbers show green, sourced "derived from your entries".
Every department tracks 10+ factors (106 KPIs) and has an Active Projects
board (seeded examples + your own) in its drill-down.

## Build phases

- **Phase 1 (this)** — full schema, 10 departments, mock data, confidence
  coloring, both modes, all views (overview, drill-down, competitor grid
  sortable by velocity/distribution/share/launches, cadence filter).
- **Phase 2** — wire free [E] sources behind the same interface: SEC (public
  comps), USPTO, FDA/FSIS recalls & warning letters, LinkedIn-style job
  signals, Similarweb, Amazon rank.
- **Phase 3** — paid syndicated data (Circana/SPINS: velocity, distribution,
  share) and internal [I] sources (ERP, FP&A — including the founder tool's
  real ledgers).

## Data honesty

The company profile is **fictional demo data** (every value tagged
`source: "... (mock)"`). Competitor names are real; competitor values are
mock (confidence `guessing`, red) except where the source cites a public
record — e.g., Imagine's parent-level revenue trend from Hain Celestial
filings. Sourced category facts: Swanson is the #1-selling US broth
(Circana via Food Dive, 2022); Hain net sales $1.78B FY23 → ≈$1.53B TTM;
College Inn + Kitchen Basics ≈$110–120M net sales (B&G Foods 8-K, 2026);
US soup ≈$5.9B growing ≈2.5% CAGR; bone broth ≈$1.2B growing ≈6%.
