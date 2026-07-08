/**
 * DATA-SOURCE INTERFACE — the single swap point between DEMO and LIVE data.
 * ==========================================================================
 * Every UI component fetches through these functions and ONLY these:
 *
 *   getCompany() / getDepartments() / getKpis({mode,department,cadence})
 *   getCompetitors() / getCourier() / getSeedProjects(deptId)
 *
 * KPI shape (the data contract — identical in shared/seed.json and the API):
 *   { id, name, department, scope ("I"|"E"), cadence, value, unit,
 *     target (nullable), trend (number[]), confidence
 *     ("certain"|"likely"|"guessing"), source, note }
 *
 * Provider selection:
 *   VITE_DATA_SOURCE=mock  (default) -> bundled shared/seed.json, zero network
 *   VITE_DATA_SOURCE=api             -> FastAPI backend (VITE_API_BASE)
 *
 * The user's RAW ENTRIES (entries.js) are aggregated by derive.js into
 * KPIs, overriding demo values wherever real data exists. A LIVE backend
 * can sync the same entry shapes to a database without UI changes.
 */
import * as mock from "./mock.js";
import * as api from "./api.js";

const SOURCE = import.meta.env.VITE_DATA_SOURCE === "api" ? api : mock;

export const getCompany = (...a) => SOURCE.getCompany(...a);
export const getDepartments = (...a) => SOURCE.getDepartments(...a);
export const getKpis = (...a) => SOURCE.getKpis(...a);
export const getCompetitors = (...a) => SOURCE.getCompetitors(...a);
export const getCourier = (...a) => SOURCE.getCourier(...a);
export const getSeedProjects = (...a) => (SOURCE.getSeedProjects ? SOURCE.getSeedProjects(...a) : mock.getSeedProjects(...a));

// raw entries + user projects (browser-local; see entries.js)
export {
  ENTRY_KINDS, KIND, SALE_CHANNELS,
  addEntry, deleteEntry, listEntries, entryCount,
  userProjectsFor, addProject, deleteProject,
  exportUserData, importUserData, clearUserData
} from "./entries.js";

export const CADENCES = ["daily", "weekly", "monthly", "quarterly", "annual"];
export const CONFIDENCE = {
  certain: { color: "var(--conf-certain)", label: "Certain", desc: "filing / ERP / your data" },
  likely: { color: "var(--conf-likely)", label: "Likely", desc: "strong inference" },
  guessing: { color: "var(--conf-guessing)", label: "Guessing", desc: "filled gap / demo estimate" }
};
