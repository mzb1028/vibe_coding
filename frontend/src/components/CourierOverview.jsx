import { useEffect, useState } from "react";
import { getCourier } from "../data/index.js";

/**
 * COURIER OVERVIEW — Capstone-Courier-style company report, adapted to the
 * soup/broth CPG world. Sections mirror the Courier's pages: Selected
 * Financial Statistics (front page), Financial Summary (cash flow / balance
 * sheet / income statement), Product Analysis, Segment Analysis, Market
 * Share. All values come from the courier block of the data layer (mock).
 */
const $K = (v) =>
  v < 0 ? `($${Math.abs(v).toLocaleString("en-US")})` : `$${v.toLocaleString("en-US")}`;

const SECTIONS = [
  ["stats", "Financial Statistics"],
  ["summary", "Financial Summary"],
  ["products", "Product Analysis"],
  ["segments", "Segment Analysis"],
  ["share", "Market Share"]
];

// percent-of-sales stacked bar segment colors (categorical, fixed order)
const POS_COLORS = ["#3987e5", "#9085e9", "#199e70", "#c98500", "#e66767"];

export default function CourierOverview() {
  const [c, setC] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    getCourier().then(setC).catch((e) => setError(String(e)));
  }, []);
  if (error) return <div className="card">Data layer error: {error}</div>;
  if (!c) return <div className="card">Loading…</div>;

  const jump = (id) => document.getElementById("cr-" + id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <div className="bar" style={{ padding: 0 }}>
        <span className="lbl">Company Report · {c.asOf}</span>
        {SECTIONS.map(([id, label]) => (
          <button key={id} className="chip" onClick={() => jump(id)}>
            {label}
          </button>
        ))}
        <span className="hspace" />
        <span className="badge" style={{ color: "var(--conf-guessing)", borderColor: "rgba(208,59,59,.35)" }}>
          ● all values mock — fictional demo profile
        </span>
      </div>

      {/* ---- Selected Financial Statistics ---- */}
      <div className="card" id="cr-stats">
        <div className="sect-head" style={{ marginBottom: 8 }}>
          <h2>Selected Financial Statistics</h2>
          <span className="sub">$ figures in $K</span>
        </div>
        <div className="stat-grid">
          {c.financialStatistics.map(([k, v]) => (
            <div className="stat" key={k}>
              <div className="stat-k">{k}</div>
              <div className="stat-v">{v}</div>
            </div>
          ))}
        </div>
        <div className="sect-head" style={{ margin: "16px 0 6px" }}>
          <h2>Percent of Sales</h2>
        </div>
        <div className="pos-bar" role="img" aria-label="Percent of sales breakdown">
          {c.percentOfSales.map((s, i) => (
            <div
              key={s.name}
              className="pos-seg"
              style={{ width: `${s.pct}%`, background: POS_COLORS[i] }}
              title={`${s.name}: ${s.pct}%`}
            >
              {s.pct >= 8 ? `${s.pct}%` : ""}
            </div>
          ))}
        </div>
        <div className="legend" style={{ marginTop: 8 }}>
          {c.percentOfSales.map((s, i) => (
            <span className="k" key={s.name}>
              <span className="dot" style={{ background: POS_COLORS[i], borderRadius: 2 }} />
              {s.name} {s.pct}%
            </span>
          ))}
        </div>
      </div>

      {/* ---- Financial Summary ---- */}
      <div className="card" id="cr-summary">
        <div className="sect-head" style={{ marginBottom: 8 }}>
          <h2>Financial Summary</h2>
          <span className="sub">$K · statements follow the Courier survey layout</span>
        </div>
        <div className="fin-cols">
          <div>
            <div className="cad-h">Cash Flow Statement</div>
            <table className="fin-table">
              <tbody>
                {c.cashFlow.sections.map((sec) => (
                  <FinSection key={sec.h} sec={sec} />
                ))}
                <tr className="tot">
                  <td>{c.cashFlow.netChange[0]}</td>
                  <td>{$K(c.cashFlow.netChange[1])}</td>
                </tr>
                <tr className="tot">
                  <td>{c.cashFlow.closing[0]}</td>
                  <td>{$K(c.cashFlow.closing[1])}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <div className="cad-h">Balance Sheet</div>
            <table className="fin-table">
              <tbody>
                <tr className="sec"><td colSpan="2">Assets</td></tr>
                {c.balanceSheet.assets.map(([k, v, tot]) => (
                  <tr key={k} className={tot ? "tot" : ""}><td>{k}</td><td>{$K(v)}</td></tr>
                ))}
                <tr className="sec"><td colSpan="2">Liabilities</td></tr>
                {c.balanceSheet.liabilities.map(([k, v, tot]) => (
                  <tr key={k} className={tot ? "tot" : ""}><td>{k}</td><td>{$K(v)}</td></tr>
                ))}
                <tr className="sec"><td colSpan="2">Owners' Equity</td></tr>
                {c.balanceSheet.equity.map(([k, v, tot]) => (
                  <tr key={k} className={tot ? "tot" : ""}><td>{k}</td><td>{$K(v)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div className="cad-h">Income Statement</div>
            <table className="fin-table">
              <tbody>
                {c.incomeStatement.map(([k, v, tot]) => (
                  <tr key={k} className={tot ? "tot" : ""}><td>{k}</td><td>{$K(v)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ---- Product Analysis ---- */}
      <div className="card" id="cr-products">
        <div className="sect-head" style={{ marginBottom: 8 }}>
          <h2>Product Analysis</h2>
          <span className="sub">all SKUs · units in thousands · per-unit costs in $</span>
        </div>
        <div className="comp-table-wrap">
          <table className="comp-table">
            <thead>
              <tr>
                <th>Name</th><th>Primary Segment</th><th>Units Sold</th><th>Unit Inventory</th>
                <th>Revision Date</th><th>Age (yrs)</th><th>Quality Idx</th><th>Price</th>
                <th>Material Cost</th><th>Co-Man Cost</th><th>COGS / Unit</th>
                <th>Contribution Margin</th><th>Co-Man Utilization</th>
              </tr>
            </thead>
            <tbody>
              {c.products.map((p) => (
                <tr key={p.name}>
                  <td><span className="cname">{p.name}</span></td>
                  <td style={{ textAlign: "left", fontFamily: "var(--sans)", color: "var(--ink-2)" }}>{p.segment}</td>
                  <td>{p.unitsSoldK.toLocaleString()}</td>
                  <td>{p.inventoryK.toLocaleString()}</td>
                  <td>{p.revisionDate}</td>
                  <td>{p.ageYrs.toFixed(1)}</td>
                  <td>{p.qualityIdx}</td>
                  <td>${p.price.toFixed(2)}</td>
                  <td>${p.materialCost.toFixed(2)}</td>
                  <td>${p.coManCost.toFixed(2)}</td>
                  <td>${p.cogs.toFixed(2)}</td>
                  <td>{p.contributionMargin.toFixed(1)}%</td>
                  <td>{p.utilization}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="provenance">
          Columns adapt the Courier's Plant Information table: MTBF → Quality Index (complaint-free consistency,
          0–100); Labor Cost → Co-Man Cost (asset-light, co-manufactured); Plant Utilization → contracted co-man
          line utilization. Revision Date = last reformulation/renovation.
        </div>
      </div>

      {/* ---- Segment Analysis ---- */}
      <div className="card" id="cr-segments">
        <div className="sect-head" style={{ marginBottom: 8 }}>
          <h2>Segment Analysis</h2>
          <span className="sub">one panel per demand segment · statistics, buying criteria, top products</span>
        </div>
        <div className="seg-grid">
          {c.segments.map((s) => (
            <div className="seg-panel" key={s.name}>
              <div className="seg-title">
                {s.name} <span className="sub" style={{ fontWeight: 400 }}>· our SKU: {s.fSku}</span>
              </div>
              <table className="fin-table">
                <tbody>
                  <tr><td>Total Segment Size</td><td>${s.sizeM}M</td></tr>
                  <tr><td>Total Unit Demand</td><td>{s.unitsDemandM}M units</td></tr>
                  <tr><td>Next Year's Demand Growth Rate</td><td>{s.growthRate.toFixed(1)}%</td></tr>
                </tbody>
              </table>
              <div className="cad-h" style={{ marginTop: 10 }}>Customer Buying Criteria</div>
              <table className="fin-table">
                <thead><tr><th>Criterion</th><th style={{ textAlign: "left" }}>Expectations</th><th>Importance</th></tr></thead>
                <tbody>
                  {s.criteria.map(([k, exp, imp]) => (
                    <tr key={k}><td>{k}</td><td style={{ textAlign: "left", color: "var(--ink-3)" }}>{exp}</td><td>{imp}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="cad-h" style={{ marginTop: 10 }}>Top Products</div>
              <table className="fin-table">
                <thead><tr><th>Name</th><th style={{ textAlign: "left" }}>Company</th><th>Segment Share</th></tr></thead>
                <tbody>
                  {s.topProducts.map(([n, co, sh]) => (
                    <tr key={n} className={co === "Food Lube" ? "ours" : ""}>
                      <td>{n}</td><td style={{ textAlign: "left", color: "var(--ink-3)" }}>{co}</td><td>{sh}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Market Share ---- */}
      <div className="card" id="cr-share">
        <div className="sect-head" style={{ marginBottom: 8 }}>
          <h2>Actual Market Share</h2>
          <span className="sub">$ share of segment, L52W (est.)</span>
        </div>
        <div className="comp-table-wrap">
          <table className="comp-table">
            <thead>
              <tr>
                <th>Name</th>
                {c.marketShare.segments.map((s) => <th key={s}>{s}</th>)}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="ms-head">
                <td>Segment Size ($M est.)</td>
                {c.marketShare.segmentSizeM.map((v, i) => <td key={i}>${v}</td>)}
                <td>${c.marketShare.segmentSizeM.reduce((a, b) => a + b, 0)}</td>
              </tr>
              <tr className="ms-head">
                <td>% of Market</td>
                {c.marketShare.segmentSizeM.map((v, i) => (
                  <td key={i}>{((v / c.marketShare.segmentSizeM.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%</td>
                ))}
                <td>100%</td>
              </tr>
              {c.marketShare.rows.map((r) => {
                const totalPool = c.marketShare.segmentSizeM.reduce((a, b) => a + b, 0);
                const blended =
                  r.shares.reduce((s, pct, i) => s + (pct / 100) * c.marketShare.segmentSizeM[i], 0) / totalPool * 100;
                return (
                  <tr key={r.name} className={r.company === "Food Lube" ? (r.total ? "ours tot-row" : "ours") : r.total ? "tot-row" : ""}>
                    <td>
                      {r.name}
                      {r.company !== "—" && !r.name.startsWith("Total") && (
                        <span className="own">{r.company}</span>
                      )}
                    </td>
                    {r.shares.map((v, i) => <td key={i}>{v ? v.toFixed(1) + "%" : "—"}</td>)}
                    <td>{blended.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="provenance">{c.marketShare.note}</div>
      </div>
    </>
  );
}

function FinSection({ sec }) {
  return (
    <>
      <tr className="sec"><td colSpan="2">{sec.h}</td></tr>
      {sec.rows.map(([k, v]) => (
        <tr key={k}><td>{k}</td><td>{$K(v)}</td></tr>
      ))}
      {sec.total && (
        <tr className="tot"><td>{sec.total[0]}</td><td>{$K(sec.total[1])}</td></tr>
      )}
    </>
  );
}
