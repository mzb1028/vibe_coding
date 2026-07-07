/**
 * USER DATA STORE — the founder's real submitted numbers.
 * =========================================================
 * Observations the user submits via the Check-in view live here, persisted
 * in browser localStorage. They OVERLAY the mock seed: once a KPI has at
 * least one observation, its displayed value/trend/confidence/source come
 * from user data ("manual entry", certain/green) instead of the mock.
 *
 * Shape: { [kpiId]: [{ date: "YYYY-MM-DD", value: number }, ...] }  (sorted by date)
 *
 * This module is provider-agnostic: mock.js merges it locally; a LIVE
 * backend provider can sync the same shape to a database later.
 */
const LS_KEY = "foodlube-observations-v1";

function load() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
}
function persist(obs) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(obs));
  } catch {
    /* storage unavailable (private mode) — session-only */
  }
}

let cache = load();

export function getObservations(kpiId) {
  return cache[kpiId] || [];
}

export function submitObservations(entries, date) {
  // entries: [{ kpiId, value }]
  for (const { kpiId, value } of entries) {
    if (value === null || value === undefined || Number.isNaN(value)) continue;
    const list = (cache[kpiId] = cache[kpiId] || []);
    const existing = list.find((o) => o.date === date);
    if (existing) existing.value = value; // same-day resubmit replaces
    else list.push({ date, value });
    list.sort((a, b) => (a.date < b.date ? -1 : 1));
  }
  persist(cache);
}

export function deleteObservation(kpiId, date) {
  if (!cache[kpiId]) return;
  cache[kpiId] = cache[kpiId].filter((o) => o.date !== date);
  if (!cache[kpiId].length) delete cache[kpiId];
  persist(cache);
}

/** Merge user observations onto a seed KPI. Returns a new object. */
export function applyOverlay(kpi) {
  const obs = cache[kpi.id];
  if (!obs || !obs.length) return kpi;
  const latest = obs[obs.length - 1];
  return {
    ...kpi,
    value: latest.value,
    trend: obs.slice(-12).map((o) => o.value),
    confidence: "certain",
    source: "manual entry",
    lastUpdated: latest.date,
    observationCount: obs.length
  };
}

export function exportUserData() {
  return JSON.stringify({ format: "foodlube-observations-v1", observations: cache }, null, 2);
}
export function importUserData(json) {
  const parsed = JSON.parse(json);
  if (!parsed.observations) throw new Error("Not a Food Lube observations backup.");
  cache = parsed.observations;
  persist(cache);
}
export function clearUserData() {
  cache = {};
  persist(cache);
}
export function countEntered() {
  return Object.keys(cache).length;
}
