/**
 * DEMO PROVIDER.
 * All seed data lives in ../../../shared/seed.json (the single source of
 * truth, also served by backend/main.py). Nothing is hardcoded here or in
 * any component; this module only filters the seed — and overlays KPIs
 * that can be computed from the user's raw entries (derive.js).
 */
import seed from "@shared/seed.json";
import { deriveKpis, applyDerived } from "./derive.js";

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
  // KPIs computable from the user's raw entries override demo values.
  const derived = deriveKpis();
  return clone(rows).map((k) => applyDerived(k, derived));
}

export async function getCourier() {
  return clone(seed.courier);
}

export async function getSeedProjects(deptId) {
  return clone((seed.projects || {})[deptId] || []);
}

export async function getCompetitors() {
  // [E]-only enforcement even if the seed were edited badly.
  return clone(
    seed.competitors.map((c) => ({ ...c, kpis: c.kpis.filter((k) => k.scope === "E") }))
  );
}
