import { useEffect, useMemo, useState } from "react";
import { getCompany, getDepartments, getKpis, getCompetitors, CADENCES } from "./data/index.js";
import Legend from "./components/Legend.jsx";
import CadenceGroups from "./components/CadenceGroups.jsx";
import CompetitorGrid from "./components/CompetitorGrid.jsx";

export default function App() {
  const [mode, setMode] = useState("company"); // "company" | "industry"
  const [cadence, setCadence] = useState(null); // null = all
  const [dept, setDept] = useState(null); // department drill-down (company mode)
  const [company, setCompany] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getCompany(), getDepartments(), getCompetitors()])
      .then(([c, d, comps]) => {
        setCompany(c);
        setDepartments(d);
        setCompetitors(comps);
      })
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    getKpis({ mode, department: dept, cadence })
      .then(setKpis)
      .catch((e) => setError(String(e)));
  }, [mode, dept, cadence]);

  const deptNames = useMemo(
    () => Object.fromEntries(departments.map((d) => [d.id, d.name])),
    [departments]
  );
  // per-department counts for the drill-down cards (uses current cadence filter)
  const deptCounts = useMemo(() => {
    const m = {};
    for (const k of kpis) {
      const bucket = (m[k.department] ||= { I: 0, E: 0 });
      bucket[k.scope]++;
    }
    return m;
  }, [kpis]);

  const switchMode = (m) => {
    setMode(m);
    setDept(null);
  };

  if (error)
    return (
      <div className="wrap">
        <div className="card">Data layer error: {error}</div>
      </div>
    );

  return (
    <>
      <header className="hdr">
        <div className="block">FL</div>
        <h1>
          FOOD LUBE <span>· CPG Intelligence</span>
        </h1>
        <div className="mode-toggle" role="tablist" aria-label="Mode">
          <button role="tab" aria-selected={mode === "company"} className={mode === "company" ? "on" : ""} onClick={() => switchMode("company")}>
            My Company
          </button>
          <button role="tab" aria-selected={mode === "industry"} className={mode === "industry" ? "on" : ""} onClick={() => switchMode("industry")}>
            Industry
          </button>
        </div>
        <span className="hspace" />
        <Legend />
      </header>

      <div className="bar" role="group" aria-label="Cadence filter">
        <span className="lbl">Cadence</span>
        <button className={`chip ${cadence === null ? "on" : ""}`} onClick={() => setCadence(null)}>
          All
        </button>
        {CADENCES.map((c) => (
          <button key={c} className={`chip ${cadence === c ? "on" : ""}`} onClick={() => setCadence(c)}>
            {c}
          </button>
        ))}
        <span className="hspace" />
        <span className="sub" style={{ fontSize: 11, color: "var(--ink-3)" }}>
          {company ? company.profile : ""}
        </span>
      </div>

      <main className="wrap">
        {mode === "industry" ? (
          <>
            <CompetitorGrid competitors={competitors} />
            <div className="sect-head">
              <h2>Observable signal feed — all [E] KPIs</h2>
              <span className="sub">what the outside world can see, grouped by cadence{cadence ? ` · filtered: ${cadence}` : ""}</span>
            </div>
            <CadenceGroups kpis={kpis} deptNames={deptNames} showDept />
          </>
        ) : dept ? (
          <>
            <div className="sect-head">
              <button className="back" onClick={() => setDept(null)}>
                ← All departments
              </button>
              <h2>{deptNames[dept]}</h2>
              <span className="sub">grouped by cadence{cadence ? ` · filtered: ${cadence}` : ""}</span>
            </div>
            <CadenceGroups kpis={kpis} deptNames={deptNames} />
          </>
        ) : (
          <>
            <div className="sect-head">
              <h2>Departments</h2>
              <span className="sub">click to drill down</span>
            </div>
            <div className="dept-grid">
              {departments.map((d) => {
                const c = deptCounts[d.id] || { I: 0, E: 0 };
                return (
                  <button key={d.id} className="dept-card" onClick={() => setDept(d.id)}>
                    <h3>{d.name}</h3>
                    <div className="counts">
                      {c.I + c.E} KPIs · {c.I} internal [I] · {c.E} observable [E]
                    </div>
                    <div className="go">OPEN →</div>
                  </button>
                );
              })}
            </div>
            <div className="sect-head">
              <h2>All KPIs by cadence</h2>
              <span className="sub">{cadence ? `filtered: ${cadence}` : "what the CEO watches daily → annual"}</span>
            </div>
            <CadenceGroups kpis={kpis} deptNames={deptNames} showDept />
          </>
        )}
      </main>

      <footer className="foot">
        FOOD LUBE · CPG intelligence dashboard · Phase 1 — data source: <span>{import.meta.env.VITE_DATA_SOURCE === "api" ? "API" : "mock"}</span> · company profile is fictional demo data · competitor values mock unless a public source is cited
      </footer>
    </>
  );
}
