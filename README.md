# Food Lube — Company Command Center

A founder's command center for **Food Lube**, a startup in the US soup, broth &
concentrates space. The company starts at zero: **every company number in the
app is entered by the founder** — nothing is simulated. Market context is
sourced from public research.

## Using it

Open `index.html` in any browser. Your data is saved in that browser
(localStorage) and never leaves your machine. Use **Export backup** in the
header regularly — it downloads a JSON file you can restore with **Import** on
any computer.

### Tabs

- **Overview** — health scoreboard (cash, monthly burn, runway, spent-to-date,
  revenue, MoM growth, gross margin, inventory, CAC, stockholders' equity),
  cash-balance chart, monthly revenue vs. expenses, spend by category, and a
  you-vs-the-market benchmark table.
- **CEO** — milestones, key numbers (units produced/sold, retail doors, web
  orders, new customers — feeds CAC), projects, and weekly → five-year
  planning horizons.
- **Finance** — equity ledger (Common Stock / Additional Paid-In Capital),
  expense ledger (12 CPG categories; Equipment is capitalized), revenue ledger
  (by channel), and auto-generated **Income Statement, Balance Sheet, and
  Statement of Cash Flows** (MTD/QTD/YTD/all-time). Statement structure follows
  the Capstone layout: Sales → Variable Costs → Contribution Margin → Period
  Costs → EBIT → Taxes → Net Profit.
- **Operations** — raw-materials ledger (purchases auto-post to the expense
  ledger; on-hand quantities become balance-sheet inventory), finished-goods
  inventory, and a shipments board with carrier tracking numbers (freight
  auto-posts to expenses).
- **Market** — sourced category outlook, competitive landscape, peer cost
  structure, and a cost-driver/trend watch list.

### Accounting notes

- COGS is accrual-adjusted: material purchases sitting in inventory are an
  asset, not a cost, until consumed/sold (COGS = purchases − Δ inventory).
- Equipment is capitalized and depreciated straight-line over 60 months.
- Taxes accrue at the 21% US federal corporate rate on positive pre-tax income
  and sit in Income Tax Payable. The balance sheet always balances.
- Burn/runway use a trailing-90-day average and only display after 2+ weeks of
  ledger history.

## Data provenance (market facts)

- US soup ≈$5.9B (2024), ≈2.5% CAGR — GlobeNewswire / Mordor Intelligence (2025)
- Bone broth ≈$1.2B global (2025), ≈6% CAGR; top-5 ≈42% combined — Fortune Business Insights
- Peer gross margins 21–38%, median ≈33% (Utz 24.9%, BellRing 33.3%, Simply Good 36.2%, Hain 21.4%, FY2025) — Eightx / filings
- Trade spend 15–25% of gross sales; gross-to-net 30–40% — TrewUp / Eightx
- Swanson is the #1-selling US broth — Circana, via Food Dive (2022)
- B&G Foods acquired College Inn + Kitchen Basics for ~$110M — B&G Foods 8-K (2026)
- CPG forecast MAPE 15–25% acceptable — Planster / Imperia

## Roadmap

Later phases: hosted backend with login (multi-device sync), CSV import,
editable market-research content, and budget-vs-actual planning.
