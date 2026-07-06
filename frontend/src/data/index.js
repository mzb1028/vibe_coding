/**
 * DATA-SOURCE INTERFACE — the single swap point between MOCK and LIVE data.
 * ==========================================================================
 * Every UI component fetches through these four functions and ONLY these:
 *
 *   getCompany()                          -> { name, profile, revenueM, mode }
 *   getDepartments()                      -> [{ id, name }]
 *   getKpis({ mode, department, cadence }) -> [KPI]
 *   getCompetitors()                      -> [{ id, name, ownership, note, kpis: [KPI] }]
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
 * Phase 2/3: implement real fetchers inside api-provider (or new providers)
 * returning the same shapes. No component code changes.
 */
import * as mock from "./mock.js";
import * as api from "./api.js";

const SOURCE = import.meta.env.VITE_DATA_SOURCE === "api" ? api : mock;

export const getCompany = (...a) => SOURCE.getCompany(...a);
export const getDepartments = (...a) => SOURCE.getDepartments(...a);
export const getKpis = (...a) => SOURCE.getKpis(...a);
export const getCompetitors = (...a) => SOURCE.getCompetitors(...a);

export const CADENCES = ["daily", "weekly", "monthly", "quarterly", "annual"];
export const CONFIDENCE = {
  certain: { color: "var(--conf-certain)", label: "Certain", desc: "filing / ERP / public record" },
  likely: { color: "var(--conf-likely)", label: "Likely", desc: "strong inference" },
  guessing: { color: "var(--conf-guessing)", label: "Guessing", desc: "filled gap / mock" }
};
