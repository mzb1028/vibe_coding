import { useEffect, useState } from "react";
import { getSeedProjects, userProjectsFor, addProject, deleteProject } from "../data/index.js";

/** Active projects for one department: seeded demo projects + the user's own. */
const PSTAT = { "On track": "good", "At risk": "warning", "Behind": "serious", "Done": "neutral" };
const STATUS_ICON = { good: "✔", warning: "◔", serious: "◆", neutral: "·" };

export default function Projects({ deptId }) {
  const [seeded, setSeeded] = useState([]);
  const [tick, setTick] = useState(0);
  const [name, setName] = useState("");
  const [stage, setStage] = useState("");
  const [due, setDue] = useState("");
  const [pct, setPct] = useState("0");
  const [status, setStatus] = useState("On track");

  useEffect(() => { getSeedProjects(deptId).then(setSeeded).catch(() => setSeeded([])); }, [deptId]);
  const mine = userProjectsFor(deptId);

  const add = () => {
    if (!name.trim()) return;
    addProject(deptId, { name: name.trim(), stage: stage.trim() || "Scoping", due, pct: Math.min(100, +pct || 0), status });
    setName(""); setStage(""); setDue(""); setPct("0"); setStatus("On track");
    setTick((t) => t + 1);
  };

  const row = (p, own) => {
    const st = PSTAT[p.status] || "neutral";
    return (
      <tr key={(own ? "u" : "s") + (p.id || p.name)}>
        <td><b style={{ color: "var(--ink)" }}>{p.name}</b>{!own && <span className="own">demo</span>}</td>
        <td className="l sans" style={{ color: "var(--ink-2)" }}>{p.stage}</td>
        <td>{p.due || "—"}</td>
        <td><div className="pbar"><div className="pfill" style={{ width: `${Math.min(100, +p.pct || 0)}%` }} /></div></td>
        <td className="l"><span className={`status-chip ${st}`}>{STATUS_ICON[st]} {p.status}</span></td>
        <td style={{ textAlign: "right" }}>
          {own && <button className="row-del" onClick={() => { deleteProject(deptId, p.id); setTick((t) => t + 1); }} aria-label="Delete project">✕</button>}
        </td>
      </tr>
    );
  };

  return (
    <div className="card">
      <div className="sect-head" style={{ marginBottom: 4 }}>
        <h2>Active projects</h2>
        <span className="sub">{seeded.length + mine.length} projects · demo examples + your own</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="viz-table">
          <thead><tr><th>Project</th><th className="l">Stage</th><th>Due</th><th style={{ minWidth: 90 }}>Progress</th><th className="l">Status</th><th></th></tr></thead>
          <tbody>
            {mine.map((p) => row(p, true))}
            {seeded.map((p) => row(p, false))}
          </tbody>
        </table>
      </div>
      <div className="formgrid" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--grid)" }}>
        <div className="fld" style={{ minWidth: 200 }}><label>New project</label>
          <input className="field sans" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} /></div>
        <div className="fld"><label>Stage</label>
          <input className="field sans" value={stage} onChange={(e) => setStage(e.target.value)} placeholder="Scoping" style={{ width: 110 }} /></div>
        <div className="fld"><label>Due</label>
          <input className="field" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
        <div className="fld"><label>% done</label>
          <input className="field" type="number" min="0" max="100" value={pct} onChange={(e) => setPct(e.target.value)} style={{ width: 70 }} /></div>
        <div className="fld"><label>Status</label>
          <select className="field sans" value={status} onChange={(e) => setStatus(e.target.value)}>
            {Object.keys(PSTAT).map((s) => <option key={s}>{s}</option>)}
          </select></div>
        <button className="save-btn" onClick={add} disabled={!name.trim()}>Add</button>
      </div>
    </div>
  );
}
