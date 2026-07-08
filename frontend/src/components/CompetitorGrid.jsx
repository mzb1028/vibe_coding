import { useMemo, useState } from "react";
import { CONFIDENCE } from "../data/index.js";

/** Sort keys map to KPI id suffixes present on every competitor. */
const SORTS = [
  { key: "velocity", label: "Velocity" },
  { key: "acv", label: "Distribution" },
  { key: "share", label: "Share" },
  { key: "launches", label: "Launch activity" }
];
const COLS = [
  { suf: "velocity", label: "Velocity (u/s/w)" },
  { suf: "acv", label: "ACV dist %" },
  { suf: "share", label: "Category share %" },
  { suf: "launches", label: "Launches (12mo)" },
  { suf: "growth", label: "Rev growth % YoY" },
  { suf: "ebitda", label: "EBITDA %" },
  { suf: "bsr", label: "Amazon BSR" },
  { suf: "jobs", label: "Open roles" },
  { suf: "recalls", label: "Recalls (12mo)" }
];

const findKpi = (c, suf) => c.kpis.find((k) => k.id.endsWith("_" + suf));

export default function CompetitorGrid({ competitors }) {
  const [sortKey, setSortKey] = useState("velocity");
  const sorted = useMemo(
    () =>
      [...competitors].sort(
        (a, b) => (findKpi(b, sortKey)?.value ?? -Infinity) - (findKpi(a, sortKey)?.value ?? -Infinity)
      ),
    [competitors, sortKey]
  );
  return (
    <div className="card">
      <div className="sect-head" style={{ marginBottom: 8 }}>
        <h2>Competitor grid</h2>
        <span className="sub">externally-observable [E] KPIs only — internal metrics of competitors are unknowable</span>
        <span className="hspace" />
        <span className="lbl" style={{ fontSize: 10 }}>SORT</span>
        {SORTS.map((s) => (
          <button key={s.key} className={`chip ${sortKey === s.key ? "on" : ""}`} onClick={() => setSortKey(s.key)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="comp-table-wrap">
        <table className="comp-table">
          <thead>
            <tr>
              <th>Competitor</th>
              {COLS.map((c) => (
                <th key={c.suf}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="cname">{c.name}</span>
                  <span className="own">{c.ownership}</span>
                  <div className="cnote">{c.note}</div>
                </td>
                {COLS.map(({ suf }) => {
                  const k = findKpi(c, suf);
                  if (!k) return <td key={suf}>—</td>;
                  const conf = CONFIDENCE[k.confidence] || CONFIDENCE.guessing;
                  return (
                    <td key={suf} style={{ color: conf.color }} title={`${k.name} · ${conf.label} · source: ${k.source}`}>
                      {typeof k.value === "number" ? k.value.toLocaleString("en-US") : k.value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="provenance">
        Competitor names are real. Values are directional demo estimates (red = guessing) except where the source
        cites a public record or filing; syndicated velocity/distribution/share require Circana or SPINS.
        Hover any number for its confidence and source.
      </div>
    </div>
  );
}
