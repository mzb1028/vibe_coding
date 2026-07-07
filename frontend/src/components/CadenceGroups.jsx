import KpiCard from "./KpiCard.jsx";
import { CADENCES } from "../data/index.js";

/** KPIs grouped under daily/weekly/monthly/quarterly/annual headers. */
export default function CadenceGroups({ kpis, deptNames, showDept = false }) {
  return (
    <>
      {CADENCES.map((cad) => {
        const rows = kpis.filter((k) => k.cadence === cad);
        if (!rows.length) return null;
        return (
          <section key={cad}>
            <div className="cad-h">{cad} · {rows.length}</div>
            <div className="kpi-grid">
              {rows.map((k) => (
                <KpiCard key={k.id} kpi={k} showDept={showDept} deptName={deptNames?.[k.department]} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
