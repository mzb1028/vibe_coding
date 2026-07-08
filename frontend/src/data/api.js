/**
 * API PROVIDER — same interface as mock.js, backed by the FastAPI service.
 * Enable with VITE_DATA_SOURCE=api and set VITE_API_BASE to the deployed
 * backend URL (e.g. https://foodlube-api.onrender.com).
 */
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return res.json();
}

export const getCompany = () => get("/api/company");
export const getDepartments = () => get("/api/departments");
export const getKpis = ({ mode = "company", department = null, cadence = null } = {}) => {
  const q = new URLSearchParams({ mode });
  if (department) q.set("department", department);
  if (cadence) q.set("cadence", cadence);
  return get(`/api/kpis?${q}`);
};
export const getCompetitors = () => get("/api/competitors");
export const getCourier = () => get("/api/courier");
export const getSeedProjects = (deptId) => get(`/api/projects?department=${encodeURIComponent(deptId)}`);
