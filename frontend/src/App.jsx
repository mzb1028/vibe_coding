import { useEffect, useMemo, useState } from "react";
import {
  getCompany, getDepartments, getKpis, getCompetitors, CADENCES,
  exportUserData, importUserData, clearUserData, entryCount
} from "./data/index.js";
import Projects from "./components/Projects.jsx";
import Legend from "./components/Legend.jsx";
import CadenceGroups from "./components/CadenceGroups.jsx";
import CompetitorGrid from "./components/CompetitorGrid.jsx";
import CheckIn from "./components/CheckIn.jsx";
import CourierOverview from "./components/CourierOverview.jsx";

export default function App() {
  const [mode, setMode] = useState("overview"); // "overview" | "company" | "industry"
  const [cadence, setCadence] = useState(null); // null = all
  const [dept, setDept] = useState(null); // department drill-down (company mode)
  const [checkin, setCheckin] = useState(false); // check-in (data entry) view
  const [dataVersion, setDataVersion] = useState(0); // bump to re-read after submissions
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
    if (mode === "overview") return; // Courier overview fetches its own block
    getKpis({ mode, department: dept, cadence })
      .then(setKpis)
      .catch((e) => setError(String(e)));
  }, [mode, dept, cadence, dataVersion]);


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
    setCheckin(false);
  };

  const doExport = () => {
    const blob = new Blob([exportUserData()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `foodlube-entries-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const doImport = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        importUserData(r.result);
        setDataVersion((v) => v + 1);
      } catch (err) {
        alert(String(err.message || err));
      }
    };
    r.readAsText(f);
    e.target.value = "";
  };
  const doReset = () => {
    if (confirm("Erase all numbers you have entered and return to mock data? Export first if you want a backup.")) {
      clearUserData();
      setDataVersion((v) => v + 1);
    }
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
          CPG ENTERPRISE SYSTEM <span>· Food Lube</span>
        </h1>
        <div className="mode-toggle" role="tablist" aria-label="Mode">
          <button role="tab" aria-selected={mode === "overview"} className={mode === "overview" ? "on" : ""} onClick={() => switchMode("overview")}>
            Overview
          </button>
          <button role="tab" aria-selected={mode === "company"} className={mode === "company" ? "on" : ""} onClick={() => switchMode("company")}>
            My Company
          </button>
          <button role="tab" aria-selected={mode === "industry"} className={mode === "industry" ? "on" : ""} onClick={() => switchMode("industry")}>
            Industry
          </button>
        </div>
        {mode === "company" && (
          <button
            className={`chip ${checkin ? "on" : ""}`}
            style={checkin ? {} : { borderColor: "#2a5a8a", color: "#7fb2ea" }}
            onClick={() => setCheckin(!checkin)}
          >
            ✎ Daily log
          </button>
        )}
        <span className="hspace" />
        <Legend />
        <button className="chip" onClick={doExport} title="Download your entered numbers as a JSON backup">⭳</button>
        <label className="chip" title="Restore entered numbers from a backup" style={{ cursor: "pointer" }}>
          ⭱<input type="file" accept=".json" onChange={doImport} style={{ display: "none" }} />
        </label>
        <button className="chip" onClick={doReset} title="Erase entered numbers (back to mock)">↺</button>
      </header>

      <div className="bar" role="group" aria-label="Cadence filter" style={mode === "overview" ? { display: "none" } : {}}>
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
        {checkin && mode === "company" ? (
          <CheckIn
            onDone={() => setDataVersion((v) => v + 1)}
            onClose={() => { setCheckin(false); setDataVersion((v) => v + 1); }}
          />
        ) : mode === "overview" ? (
          <CourierOverview />
        ) : mode === "industry" ? (
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
            <Projects deptId={dept} />
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
        CPG ENTERPRISE SYSTEM · company: Food Lube · base data: <span>{import.meta.env.VITE_DATA_SOURCE === "api" ? "API" : "demo"}</span> · {entryCount()} raw {entryCount() === 1 ? "entry" : "entries"} logged — KPIs computed from them show green ("derived from your entries") · your data stays in this browser, use ⭳ to back up · competitor values are directional demo estimates unless a public source is cited
      </footer>
    </>
  );
}
