import { useMemo, useState } from "react";
import { CADENCES, submitObservations } from "../data/index.js";

/**
 * CHECK-IN — the founder's data-entry ritual.
 * Pick a cadence, enter this period's real numbers, submit. Filled fields
 * become observations (source: "manual entry", confidence: certain) that
 * override the mock value and build the KPI's real trend history.
 * Blank fields are skipped — enter only what you know.
 */
export default function CheckIn({ kpis, deptNames, onDone }) {
  const [cadence, setCadence] = useState("weekly");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState(false);

  const rows = useMemo(() => kpis.filter((k) => k.cadence === cadence), [kpis, cadence]);
  const byDept = useMemo(() => {
    const m = {};
    for (const k of rows) (m[k.department] = m[k.department] || []).push(k);
    return m;
  }, [rows]);

  const filled = Object.values(values).filter((v) => v !== "" && v !== null).length;

  const submit = () => {
    const entries = Object.entries(values)
      .filter(([, v]) => v !== "" && v !== null && !Number.isNaN(parseFloat(v)))
      .map(([kpiId, v]) => ({ kpiId, value: parseFloat(v) }));
    if (!entries.length) return;
    submitObservations(entries, date);
    setValues({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onDone();
  };

  return (
    <div className="card">
      <div className="sect-head" style={{ marginBottom: 10 }}>
        <h2>Check-in — enter this period's numbers</h2>
        <span className="sub">blank = skip · submitted numbers turn green (certain · manual entry) and build your real history</span>
      </div>
      <div className="bar" style={{ padding: "0 0 12px" }}>
        <span className="lbl">Cadence</span>
        {CADENCES.map((c) => (
          <button key={c} className={`chip ${cadence === c ? "on" : ""}`} onClick={() => setCadence(c)}>
            {c}
          </button>
        ))}
        <span className="lbl" style={{ marginLeft: 12 }}>As of</span>
        <input
          type="date"
          className="chip"
          style={{ background: "var(--raised)", color: "var(--ink)" }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Observation date"
        />
        <span className="hspace" />
        <button className="chip" onClick={onDone}>Cancel</button>
        <button
          className="chip on"
          style={{ background: "#1c5cab", borderColor: "#1c5cab", color: "#fff" }}
          onClick={submit}
          disabled={!filled}
        >
          Submit {filled ? `${filled} value${filled > 1 ? "s" : ""}` : ""}
        </button>
        {saved && <span style={{ color: "var(--conf-certain)", fontSize: 12 }}>Saved ✓</span>}
      </div>
      {Object.entries(byDept).map(([deptId, list]) => (
        <section key={deptId} style={{ marginBottom: 14 }}>
          <div className="cad-h">{deptNames[deptId] || deptId}</div>
          <div className="checkin-grid">
            {list.map((k) => (
              <label key={k.id} className="ci-row">
                <span className="ci-name">
                  {k.name}
                  <span className={`badge scope-${k.scope}`} style={{ marginLeft: 6 }}>
                    [{k.scope}]
                  </span>
                </span>
                <span className="ci-last" title="Current displayed value">
                  now: {typeof k.value === "number" ? k.value.toLocaleString("en-US") : k.value} {k.unit}
                  {k.source === "manual entry" ? " · yours" : " · demo"}
                </span>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  className="ci-input"
                  placeholder={k.unit}
                  value={values[k.id] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [k.id]: e.target.value }))}
                  aria-label={`${k.name} (${k.unit})`}
                />
              </label>
            ))}
          </div>
        </section>
      ))}
      {!rows.length && <div className="provenance">No KPIs at this cadence.</div>}
    </div>
  );
}
