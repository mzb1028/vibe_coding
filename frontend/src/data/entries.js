/**
 * RAW DATA ENTRIES — the founder's daily log.
 * ============================================
 * The user records granular, bottom-up facts (a charge, a sale, a count)
 * and the platform files each one automatically (see `bucket`/`department`
 * on its kind) and derives KPIs from them (derive.js). Entries persist in
 * localStorage; export/import moves them between machines.
 *
 * Entry shape: { id, date "YYYY-MM-DD", kind, amount?, qty?, unitCost?,
 *                channel?, note }
 */
const LS_ENTRIES = "foodlube-entries-v2";
const LS_PROJECTS = "foodlube-projects-v1";

/* ---------------- entry kinds catalog ---------------- */
/* group: form section · bucket: where it files financially ·
   department: which department owns it · fields: which inputs show */
export const ENTRY_KINDS = [
  // ---- Cost of goods (variable) ----
  { id: "raw_material",  label: "Raw materials (ingredients)",        group: "Cost of goods",  bucket: "COGS",         department: "supply",  fields: ["amount"] },
  { id: "packaging",     label: "Packaging",                          group: "Cost of goods",  bucket: "COGS",         department: "supply",  fields: ["amount"] },
  { id: "comanufacturing",label: "Co-manufacturer / tolling fees",    group: "Cost of goods",  bucket: "COGS",         department: "supply",  fields: ["amount"] },
  { id: "freight_in",    label: "Transportation — inbound freight",   group: "Cost of goods",  bucket: "COGS",         department: "supply",  fields: ["amount"] },
  { id: "duties",        label: "Duties & customs",                   group: "Cost of goods",  bucket: "COGS",         department: "supply",  fields: ["amount"] },
  // ---- Logistics & storage (variable, below gross margin) ----
  { id: "freight_out",   label: "Transportation — outbound freight",  group: "Logistics & storage", bucket: "Distribution", department: "supply", fields: ["amount"] },
  { id: "storage",       label: "Storage / 3PL warehousing",          group: "Logistics & storage", bucket: "Distribution", department: "supply", fields: ["amount"] },
  // ---- Operating expenses ----
  { id: "marketing_media",label: "Marketing — media & ads",           group: "Operating spend", bucket: "OpEx · Marketing", department: "mkt",   fields: ["amount"] },
  { id: "marketing_other",label: "Marketing — agency, content, samples",group:"Operating spend", bucket: "OpEx · Marketing", department: "mkt",  fields: ["amount"] },
  { id: "trade_promo",   label: "Trade promotion / retailer programs",group: "Operating spend", bucket: "OpEx · Trade",     department: "trade", fields: ["amount"] },
  { id: "travel",        label: "Travel & entertainment",             group: "Operating spend", bucket: "OpEx · T&E",       department: "finance", fields: ["amount"] },
  { id: "salaries",      label: "Salaries & contractors",             group: "Operating spend", bucket: "OpEx · Payroll",   department: "people", fields: ["amount"] },
  { id: "rnd",           label: "R&D / product development",          group: "Operating spend", bucket: "OpEx · R&D",       department: "rnd",   fields: ["amount"] },
  { id: "legal",         label: "Legal & compliance",                 group: "Operating spend", bucket: "OpEx · Legal",     department: "legal", fields: ["amount"] },
  { id: "insurance",     label: "Insurance, fees & certifications",   group: "Operating spend", bucket: "OpEx · Admin",     department: "quality", fields: ["amount"] },
  { id: "software",      label: "Software & tools",                   group: "Operating spend", bucket: "OpEx · Admin",     department: "finance", fields: ["amount"] },
  { id: "other_opex",    label: "Other operating expense",            group: "Operating spend", bucket: "OpEx · Other",     department: "finance", fields: ["amount"] },
  // ---- Capital ----
  { id: "equipment",     label: "Equipment purchase (CapEx)",         group: "Capital",        bucket: "CapEx",        department: "finance", fields: ["amount"] },
  { id: "equity",        label: "Equity investment received",         group: "Capital",        bucket: "Financing",    department: "finance", fields: ["amount"] },
  // ---- Revenue ----
  { id: "sale",          label: "Sale / revenue",                     group: "Revenue",        bucket: "Revenue",      department: "sales",   fields: ["amount", "qty", "channel"] },
  // ---- Inventory & operations counts (non-cash) ----
  { id: "inv_raw",       label: "Inventory on hand — raw & packaging ($ value)", group: "Inventory & counts", bucket: "Inventory snapshot", department: "supply", fields: ["amount"] },
  { id: "inv_fg",        label: "Inventory on hand — finished goods", group: "Inventory & counts", bucket: "Inventory snapshot", department: "supply", fields: ["qty", "unitCost"] },
  { id: "units_produced",label: "Units produced",                     group: "Inventory & counts", bucket: "Operations count", department: "supply", fields: ["qty"] },
  { id: "retail_doors",  label: "Retail doors (current total)",       group: "Inventory & counts", bucket: "Operations count", department: "sales",  fields: ["qty"] },
  { id: "web_orders",    label: "Website orders",                     group: "Inventory & counts", bucket: "Operations count", department: "mkt",    fields: ["qty"] },
  { id: "new_customers", label: "New customers",                      group: "Inventory & counts", bucket: "Operations count", department: "mkt",    fields: ["qty"] },
  { id: "complaints",    label: "Consumer complaints",                group: "Inventory & counts", bucket: "Operations count", department: "quality", fields: ["qty"] }
];
export const KIND = Object.fromEntries(ENTRY_KINDS.map((k) => [k.id, k]));
export const SALE_CHANNELS = ["DTC / Web", "Retail", "Wholesale / Distributor", "Foodservice", "Farmers Market / Events", "Other"];

/* ---------------- store ---------------- */
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function persist(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* private mode */ }
}
let entries = load(LS_ENTRIES, []);
let userProjects = load(LS_PROJECTS, {}); // { deptId: [project] }
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function listEntries() { return [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)); }
export function entryCount() { return entries.length; }
export function addEntry(e) {
  if (!KIND[e.kind]) throw new Error("Unknown entry kind: " + e.kind);
  entries.push({ id: uid(), ...e });
  persist(LS_ENTRIES, entries);
}
export function deleteEntry(id) {
  entries = entries.filter((e) => e.id !== id);
  persist(LS_ENTRIES, entries);
}
export function allEntries() { return entries; }

/* ---------------- user projects ---------------- */
export function userProjectsFor(deptId) { return userProjects[deptId] || []; }
export function addProject(deptId, p) {
  (userProjects[deptId] = userProjects[deptId] || []).push({ id: uid(), ...p });
  persist(LS_PROJECTS, userProjects);
}
export function deleteProject(deptId, id) {
  userProjects[deptId] = (userProjects[deptId] || []).filter((p) => p.id !== id);
  persist(LS_PROJECTS, userProjects);
}

/* ---------------- backup ---------------- */
export function exportUserData() {
  return JSON.stringify({ format: "foodlube-data-v2", entries, projects: userProjects }, null, 2);
}
export function importUserData(json) {
  const parsed = JSON.parse(json);
  if (!parsed.entries) throw new Error("Not a CPG Enterprise System backup file.");
  entries = parsed.entries;
  userProjects = parsed.projects || {};
  persist(LS_ENTRIES, entries);
  persist(LS_PROJECTS, userProjects);
}
export function clearUserData() {
  entries = []; userProjects = {};
  persist(LS_ENTRIES, entries); persist(LS_PROJECTS, userProjects);
}
