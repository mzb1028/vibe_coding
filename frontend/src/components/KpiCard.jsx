import Sparkline from "./Sparkline.jsx";
import { CONFIDENCE } from "../data/index.js";

const fmt = (v) =>
  typeof v !== "number" ? String(v)
    : Math.abs(v) >= 1000 ? v.toLocaleString("en-US")
    : Number.isInteger(v) ? String(v)
    : v.toFixed(Math.abs(v) < 10 ? 2 : 1);

export default function KpiCard({ kpi, showDept, deptName }) {
  const conf = CONFIDENCE[kpi.confidence] || CONFIDENCE.guessing;
  return (
    <div className="kpi" data-kpi={kpi.id}>
      <div className="top">
        <span className="name">{kpi.name}</span>
        <span className={`badge scope-${kpi.scope}`} title={kpi.scope === "I" ? "Internal-only — invisible from outside" : "Externally observable"}>
          {kpi.scope === "I" ? "[I] internal" : "[E] observable"}
        </span>
      </div>
      <div className="valrow">
        <span className="val" style={{ color: conf.color }} title={`Confidence: ${conf.label} — ${conf.desc}`}>
          {fmt(kpi.value)}
        </span>
        <span className="unit">{kpi.unit}</span>
        {kpi.target != null && <span className="tgt">target {fmt(kpi.target)}</span>}
      </div>
      <Sparkline data={kpi.trend} />
      <div className="meta">
        <span>{showDept && deptName ? deptName : kpi.cadence}</span>
        <span title="Data source">
          {kpi.source}
          {kpi.lastUpdated ? ` · ${kpi.lastUpdated}` : ""}
        </span>
      </div>
      {kpi.note && <div className="note">{kpi.note}</div>}
    </div>
  );
}
