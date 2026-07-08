/**
 * DERIVATION ENGINE — computes KPIs bottom-up from raw entries.
 * =============================================================
 * The user records granular facts (entries.js); this module aggregates
 * them into the KPIs the dashboard displays. A derived KPI overrides its
 * demo value with { value, unit, trend, confidence: "certain",
 * source: "derived from your entries" }.
 *
 * Conventions:
 * - Flows (spend, revenue) are trailing-30-day sums; trends are the last
 *   12 calendar months.
 * - Stocks (cash, inventory, doors) are latest/cumulative positions.
 * - COGS bucket: raw materials, packaging, co-man, inbound freight, duties.
 * - Distribution: outbound freight + storage (in contribution margin,
 *   below gross margin).
 */
import { allEntries, KIND } from "./entries.js";

const DAY = 864e5;
const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => iso(new Date(Date.now() - n * DAY));
const monthKey = (dateStr) => dateStr.slice(0, 7);

const COGS_KINDS = ["raw_material", "packaging", "comanufacturing", "freight_in", "duties"];
const DIST_KINDS = ["freight_out", "storage"];
const MKT_KINDS = ["marketing_media", "marketing_other"];
const OPEX_KINDS = [...MKT_KINDS, "trade_promo", "travel", "salaries", "rnd", "legal", "insurance", "software", "other_opex"];
const OUT_KINDS = [...COGS_KINDS, ...DIST_KINDS, ...OPEX_KINDS, "equipment"];

function sum(rows, kinds, from, to, field = "amount") {
  const set = new Set(kinds);
  return rows.reduce((s, e) => {
    if (!set.has(e.kind)) return s;
    if (from && e.date < from) return s;
    if (to && e.date > to) return s;
    return s + (+e[field] || 0);
  }, 0);
}
/** last-12-months monthly series of a summing function */
function monthlySeries(rows, fn) {
  const now = new Date();
  const out = [];
  for (let i = 11; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
    out.push(+fn(rows.filter((e) => monthKey(e.date) === key)).toFixed(2));
  }
  return out;
}
function latest(rows, kind) {
  const list = rows.filter((e) => e.kind === kind).sort((a, b) => (a.date < b.date ? -1 : 1));
  return list.length ? list[list.length - 1] : null;
}
const money = (v) =>
  Math.abs(v) >= 1e6 ? { value: +(v / 1e6).toFixed(2), unit: "$M" }
  : Math.abs(v) >= 1e3 ? { value: +(v / 1e3).toFixed(1), unit: "$K" }
  : { value: +v.toFixed(2), unit: "$" };

/**
 * Returns { kpiId: { value, unit?, trend?, lastUpdated } } for every KPI
 * that can be honestly computed from the entries the user has recorded.
 */
export function deriveKpis() {
  const rows = allEntries();
  if (!rows.length) return {};
  const o = {};
  const t30 = daysAgo(30), t90 = daysAgo(90);
  const lastDate = rows.map((e) => e.date).sort().slice(-1)[0];
  const anyMoney = rows.some((e) => OUT_KINDS.includes(e.kind) || e.kind === "sale" || e.kind === "equity");

  const rev30 = sum(rows, ["sale"], t30);
  const revAll = sum(rows, ["sale"]);
  const units30 = sum(rows, ["sale"], t30, null, "qty");
  const cogs30 = sum(rows, COGS_KINDS, t30);
  const dist30 = sum(rows, DIST_KINDS, t30);
  const mkt30 = sum(rows, MKT_KINDS, t30);
  const opex30 = sum(rows, OPEX_KINDS, t30);
  const hasSales = rows.some((e) => e.kind === "sale");

  const set = (id, value, unit, seriesFn) => {
    o[id] = { value, lastUpdated: lastDate };
    if (unit) o[id].unit = unit;
    if (seriesFn) {
      const tr = monthlySeries(rows, seriesFn);
      if (tr.some((v) => v !== 0)) o[id].trend = tr;
    }
  };

  /* ---- cash & burn ---- */
  if (anyMoney) {
    const cashAt = (upTo) =>
      sum(rows, ["equity", "sale"], null, upTo) - sum(rows, OUT_KINDS, null, upTo);
    const cash = cashAt(null);
    const m = money(cash);
    set("fin_cash", m.value, m.unit);
    o.fin_cash.trend = (() => {
      const now = new Date(), tr = [];
      for (let i = 11; i >= 0; i--) {
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        tr.push(+(cashAt(iso(end)) / (m.unit === "$M" ? 1e6 : m.unit === "$K" ? 1e3 : 1)).toFixed(2));
      }
      return tr;
    })();

    const days = Math.min(90, Math.max(1, Math.round((Date.now() - new Date(rows.map((e) => e.date).sort()[0] + "T12:00:00")) / DAY) + 1));
    const out90 = sum(rows, OUT_KINDS, t90);
    const in90 = sum(rows, ["sale"], t90);
    const burnMonthly = ((out90 - in90) / days) * 30.44;
    if (days >= 14) {
      const bm = money(Math.max(0, burnMonthly));
      set("exec_burn", bm.value, bm.unit + (burnMonthly <= 0 ? " (cash-generative)" : ""));
      if (burnMonthly > 0) set("exec_runway", +((cash / burnMonthly) * 4.33).toFixed(1), "weeks");
    }
    const nm = money(in90 ? in90 - out90 : -out90);
    set("fin_netcash", nm.value, nm.unit, (r) => sum(r, ["sale"]) - sum(r, OUT_KINDS));
  }

  /* ---- revenue & margin ---- */
  if (hasSales) {
    const rm = money(rev30);
    set("sls_rev30", rm.value, rm.unit, (r) => sum(r, ["sale"]));
    set("sls_orders", +(rev30 / 30 / 1000).toFixed(2), "$K/day");
    if (units30 > 0) {
      set("exec_units", units30 >= 1000 ? +(units30 / 1000).toFixed(1) : units30, units30 >= 1000 ? "K units" : "units", (r) => sum(r, ["sale"], null, null, "qty"));
      set("exec_asp", +(rev30 / units30).toFixed(2), "$");
      if (cogs30 > 0) set("sc_landed", +(cogs30 / units30).toFixed(2), "$");
    }
    if (rev30 > 0) {
      set("exec_gm", +(((rev30 - cogs30) / rev30) * 100).toFixed(1), "%",
        (r) => { const rv = sum(r, ["sale"]); return rv ? ((rv - sum(r, COGS_KINDS)) / rv) * 100 : 0; });
      set("mkt_pct", +((mkt30 / rev30) * 100).toFixed(1), "%");
      set("sc_freight_pct", +((sum(rows, ["freight_in", "freight_out"], t30) / rev30) * 100).toFixed(1), "%");
      set("sc_storage_pct", +((sum(rows, ["storage"], t30) / rev30) * 100).toFixed(1), "%");
      const pay30 = sum(rows, ["salaries"], t30);
      if (pay30 > 0) set("ppl_payroll_pct", +((pay30 / rev30) * 100).toFixed(1), "%");
    }
  }

  /* ---- spend lines (only when that kind has been recorded) ---- */
  const spendLine = (id, kinds) => {
    if (!rows.some((e) => kinds.includes(e.kind))) return;
    const m = money(sum(rows, kinds, t30));
    set(id, m.value, m.unit, (r) => sum(r, kinds));
  };
  spendLine("mkt_spend", MKT_KINDS);
  spendLine("trd_spend", ["trade_promo"]);
  spendLine("fin_travel", ["travel"]);
  spendLine("ppl_payroll", ["salaries"]);
  spendLine("rnd_spend", ["rnd"]);
  spendLine("leg_spend", ["legal"]);
  if (rows.some((e) => OPEX_KINDS.includes(e.kind))) {
    const m = money(opex30);
    set("fin_opex", m.value, m.unit, (r) => sum(r, OPEX_KINDS));
  }
  if (rows.some((e) => e.kind === "equipment")) {
    const m = money(sum(rows, ["equipment"]));
    set("fin_capex", m.value, m.unit);
  }

  /* ---- inventory ---- */
  const raw = latest(rows, "inv_raw");
  const fg = latest(rows, "inv_fg");
  if (raw || fg) {
    const val = (raw ? +raw.amount || 0 : 0) + (fg ? (+fg.qty || 0) * (+fg.unitCost || 0) : 0);
    const m = money(val);
    set("sc_inventory", m.value, m.unit);
  }

  /* ---- operational counts ---- */
  const countLine = (id, kind, mode) => {
    if (!rows.some((e) => e.kind === kind)) return;
    if (mode === "latest") { const e = latest(rows, kind); set(id, +e.qty || 0, null); }
    else { set(id, sum(rows, [kind], t30, null, "qty"), null, (r) => sum(r, [kind], null, null, "qty")); }
  };
  countLine("sls_doors", "retail_doors", "latest");
  countLine("mkt_weborders", "web_orders", "sum30");
  countLine("qa_complaint30", "complaints", "sum30");
  if (rows.some((e) => e.kind === "units_produced")) {
    const up = sum(rows, ["units_produced"], t30, null, "qty");
    set("sc_units_prod", up >= 1000 ? +(up / 1000).toFixed(1) : up, up >= 1000 ? "K units" : "units", (r) => sum(r, ["units_produced"], null, null, "qty"));
  }
  const cust30 = sum(rows, ["new_customers"], t30, null, "qty");
  if (cust30 > 0 && mkt30 + sum(rows, ["trade_promo"], t30) > 0) {
    set("mkt_cac", +((mkt30 + sum(rows, ["trade_promo"], t30)) / cust30).toFixed(2), "$");
  }

  return o;
}

/** merge derived results onto a seed KPI object */
export function applyDerived(kpi, derived) {
  const d = derived[kpi.id];
  if (!d) return kpi;
  return {
    ...kpi,
    value: d.value,
    unit: d.unit || kpi.unit,
    trend: d.trend || kpi.trend,
    confidence: "certain",
    source: "derived from your entries",
    lastUpdated: d.lastUpdated
  };
}
