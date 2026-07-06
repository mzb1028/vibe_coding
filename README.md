# vibe_coding_test

## Food Lube — Executive Command Center (prototype)

A high-fidelity, dark-terminal executive dashboard prototype for **Food Lube Co.**,
a fictional ~$1.4B soup, broth & culinary concentrates challenger. Conceptually
grounded in Capsim Capstone 2.0 business logic, translated into real-world food
CPG metrics (trade spend, OTIF, OEE, forecast MAPE, demand-space share).

- `index.html` — self-contained prototype (open directly in a browser). Seeded
  daily simulation data (730 days) plus a live intraday tick: ticker, run-rate
  hero, and alert stream update in real time.
- **Department workspaces**: each scorecard opens a full page (hash-routed
  tabs) with key metrics, a 90-day trend, an active-projects portfolio,
  sourced industry benchmarks, and related alerts.
- **User data entry**: "Edit data" on any department page lets you type your
  own numbers (KPI values/deltas, health score, projects — add/remove/edit).
  Edits persist in browser localStorage, flow back to the Overview tiles and
  scorecards, and can be exported/imported as JSON from the header.
- Industry-specific config lives in the `PACK` object at the top of the script —
  segments, competitors, share matrix, ticker symbols, departments, alerts — so
  the engine can be re-pointed at another vertical (snacks, sensors) by swapping
  the pack.
- Competitor set (real companies, configurable): Knorr (Unilever), Better Than
  Bouillon (Summit Hill), Pacific Foods (Campbell's), Kettle & Fire, Imagine (Hain).

## Data provenance

Food Lube company values are **seeded simulation** (the company is fictional).
Everything stated about the real world is sourced:

- Trade spend 15–25% of gross sales; gross-to-net deductions 30–40% — TrewUp / Eightx CPG benchmarks
- Food pure-play gross margins 21–38% (median ~33%); Utz 24.9%, BellRing 33.3%, Simply Good Foods 36.2%, Hain 21.4% (FY2025) — Eightx / company filings
- CPG forecast MAPE 15–25% acceptable; hero-SKU accuracy targets 80–90% — Planster / Imperia
- OEE world-class ≈85%; food plants typically 60–75% — Brightly Software / Explitia
- US soup market ≈$5.9B (2024), ≈2.5% CAGR — GlobeNewswire / Mordor Intelligence
- Bone broth ≈$1.2B global (2025), ≈6% CAGR; top-5 players ≈42% combined — Fortune Business Insights
- Swanson is the #1-selling US broth — Circana, via Food Dive (2022)
- B&G Foods acquired College Inn + Kitchen Basics for ~$110M (≈$110–120M net sales) — B&G Foods 8-K (2026)

Brand-level market share **by demand space is illustrative** (syndicated
Circana/NIQ data is not public) and is labeled as such in the UI. Alert-feed
items referencing real companies are either sourced facts (marked `FACT`) or
hypothetical scenarios (marked `SCENARIO`); all internal events are marked `SIM`.
