# vibe_coding_test

## Food Lube — Executive Command Center (prototype)

A high-fidelity, dark-terminal executive dashboard prototype for **Food Lube Co.**,
a fictional ~$1.4B soup, broth & culinary concentrates challenger. Conceptually
grounded in Capsim Capstone 2.0 business logic, translated into real-world food
CPG metrics (trade spend, OTIF, OEE, forecast MAPE, demand-space share).

- `index.html` — self-contained prototype (open directly in a browser). Seeded
  daily simulation data (730 days) plus a live intraday tick: ticker, run-rate
  hero, and alert stream update in real time.
- Industry-specific config lives in the `PACK` object at the top of the script —
  segments, competitors, share matrix, ticker symbols, departments, alerts — so
  the engine can be re-pointed at another vertical (snacks, sensors) by swapping
  the pack.
- Competitor set (real companies, configurable): Knorr (Unilever), Better Than
  Bouillon (Summit Hill), Pacific Foods (Campbell's), Kettle & Fire, Imagine (Hain).

All numbers are simulated for design purposes — not actual market data.
