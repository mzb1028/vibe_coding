/**
 * MOCK PROVIDER — Phase 1.
 * All seed data lives in ../../../shared/seed.json (the single source of
 * truth, also served by backend/main.py). Nothing is hardcoded here or in
 * any component; this module only filters the seed.
 */
import seed from "@shared/seed.json";
import { applyOverlay } from "./userStore.js";

const clone = (x) => JSON.parse(JSON.stringify(x));

export async function getCompany() {
  return clone(seed.company);
}

export async function getDepartments() {
  return clone(seed.departments);
}

export async function getKpis({ mode = "company", department = null, cadence = null } = {}) {
  let rows = seed.kpis;
  if (mode === "industry") rows = rows.filter((k) => k.scope === "E");
  if (department) rows = rows.filter((k) => k.department === department);
  if (cadence) rows = rows.filter((k) => k.cadence === cadence);
  // User-submitted observations override mock values per KPI.
  return clone(rows).map(applyOverlay);
}

export async function getCompetitors() {
  // [E]-only enforcement even if the seed were edited badly.
  return clone(
    seed.competitors.map((c) => ({ ...c, kpis: c.kpis.filter((k) => k.scope === "E") }))
  );
}
