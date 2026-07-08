import { useMemo, useState } from "react";
import { ENTRY_KINDS, KIND, SALE_CHANNELS, addEntry, deleteEntry, listEntries } from "../data/index.js";

/**
 * DAILY LOG — raw, bottom-up data entry.
 * You record what actually happened (a charge, a sale, a count); the
 * platform files it automatically (COGS / OpEx / CapEx / Revenue /
 * Inventory, owning department) and derives the KPIs from it (derive.js).
 */
const GROUPS = [...new Set(ENTRY_KINDS.map((k) => k.group))];
const money = (v) => "$" + (+v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD = (s) => new Date(s + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function CheckIn({ onDone, onClose }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [kindId, setKindId] = useState("raw_material");
  const [amount, setAmount] = useState("");
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [channel, setChannel] = useState(SALE_CHANNELS[0]);
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState("");
  const [, setTick] = useState(0);

  const kind = KIND[kindId];
  const rows = useMemo(() => listEntries().slice(0, 40), [flash]); // refresh on add/delete

  const canSubmit =
    (kind.fields.includes("amount") ? parseFloat(amount) > 0 : true) &&
    (kind.fields.includes("qty") && !kind.fields.includes("amount") ? parseFloat(qty) > 0 : true);

  const submit = () => {
    const e = { date, kind: kindId, note: note.trim() };
    if (kind.fields.includes("amount")) e.amount = parseFloat(amount) || 0;
    if (kind.fields.includes("qty")) e.qty = parseFloat(qty) || 0;
    if (kind.fields.includes("unitCost")) e.unitCost = parseFloat(unitCost) || 0;
    if (kind.fields.includes("channel")) e.channel = channel;
    addEntry(e);
    setAmount(""); setQty(""); setUnitCost(""); setNote("");
    setFlash(`Filed → ${kind.bucket}`);
    setTimeout(() => setFlash(""), 2500);
    setTick((t) => t + 1);
    onDone();
  };

  return (
    <>
      <div className="card">
        <div className="sect-head" style={{ marginBottom: 10 }}>
          <h2>Daily log — record what happened</h2>
          <span className="sub">enter the raw fact; the platform files it and calculates your KPIs from the bottom up</span>
        </div>
        <div className="formgrid">
          <div className="fld">
            <label>What is it?</label>
            <select className="field sans" value={kindId} onChange={(e) => setKindId(e.target.value)} style={{ minWidth: 280 }}>
              {GROUPS.map((g) => (
                <optgroup key={g} label={g}>
                  {ENTRY_KINDS.filter((k) => k.group === g).map((k) => (
                    <option key={k.id} value={k.id}>{k.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          {kind.fields.includes("amount") && (
            <div className="fld"><label>{kindId === "inv_raw" ? "Value on hand $" : "Amount $"}</label>
              <input className="field" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: 120 }} /></div>
          )}
          {kind.fields.includes("qty") && (
            <div className="fld"><label>{kindId === "sale" ? "Units sold" : kindId === "retail_doors" ? "Total doors" : "Quantity"}</label>
              <input className="field" type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: 100 }} /></div>
          )}
          {kind.fields.includes("unitCost") && (
            <div className="fld"><label>Unit cost $</label>
              <input className="field" type="number" min="0" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} style={{ width: 100 }} /></div>
          )}
          {kind.fields.includes("channel") && (
            <div className="fld"><label>Channel</label>
              <select className="field sans" value={channel} onChange={(e) => setChannel(e.target.value)}>
                {SALE_CHANNELS.map((c) => <option key={c}>{c}</option>)}
              </select></div>
          )}
          <div className="fld"><label>Date</label>
            <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="fld" style={{ flex: 1, minWidth: 160 }}><label>Note / vendor / customer</label>
            <input className="field sans" value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" style={{ width: "100%" }} /></div>
          <button className="save-btn" onClick={submit} disabled={!canSubmit}>Add entry</button>
        </div>
        <div className="filednote">
          Files to: <b>{kind.bucket}</b> · owned by <b>{deptLabel(kind.department)}</b>
          {flash && <span style={{ color: "var(--conf-certain)", marginLeft: 12 }}>{flash} ✓</span>}
        </div>
      </div>

      <div className="card">
        <div className="sect-head" style={{ marginBottom: 4 }}>
          <h2>Recent entries</h2>
          <span className="sub">{rows.length ? `latest ${rows.length}` : ""} · derived KPIs update instantly and show green as “derived from your entries”</span>
          <span className="hspace" />
          <button className="chip" onClick={onClose}>Close log</button>
        </div>
        {rows.length ? (
          <div style={{ overflowX: "auto" }}>
            <table className="viz-table">
              <thead><tr><th>Entry</th><th className="l">Filed to</th><th>Amount</th><th>Qty</th><th>Date</th><th className="l">Note</th><th></th></tr></thead>
              <tbody>
                {rows.map((e) => {
                  const k = KIND[e.kind] || {};
                  return (
                    <tr key={e.id}>
                      <td>{k.label || e.kind}{e.channel ? <span className="own">{e.channel}</span> : null}</td>
                      <td className="l sans" style={{ color: "var(--ink-3)" }}>{k.bucket}</td>
                      <td>{e.amount != null ? money(e.amount) : e.qty != null && e.unitCost != null ? money(e.qty * e.unitCost) : "—"}</td>
                      <td>{e.qty != null ? (+e.qty).toLocaleString() : "—"}</td>
                      <td>{fmtD(e.date)}</td>
                      <td className="l sans" style={{ color: "var(--ink-3)" }}>{e.note || ""}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="row-del" onClick={() => { deleteEntry(e.id); setFlash("deleted " + e.id); setTick((t) => t + 1); onDone(); }} aria-label="Delete entry">✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty"><b>Nothing logged yet.</b> Start with today's charges — a bag of ingredients, a freight bill, an ad payment — or your first sale. Every entry makes more of the dashboard real.</div>
        )}
      </div>
    </>
  );
}
const DEPT_LABELS = { supply: "Supply Chain", mkt: "Marketing / Brand / DTC", trade: "Trade Marketing / RGM", finance: "Finance / FP&A", people: "People / HR", rnd: "R&D", legal: "Legal / IP", quality: "Quality", sales: "Sales / Commercial", exec: "Executive" };
function deptLabel(id) { return DEPT_LABELS[id] || id; }
