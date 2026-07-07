export default function Sparkline({ data, width = 110, height = 26 }) {
  if (!data || data.length < 2) return null;
  const pad = 3;
  const mn = Math.min(...data), mx = Math.max(...data);
  const x = (i) => pad + (i * (width - 2 * pad)) / (data.length - 1);
  const y = (v) => (mx === mn ? height / 2 : height - pad - ((v - mn) * (height - 2 * pad)) / (mx - mn));
  const d = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const li = data.length - 1;
  return (
    <svg width={width} height={height} aria-hidden="true">
      <path d={d} fill="none" stroke="#3a3f47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(li)} cy={y(data[li])} r="4.5" fill="#121316" />
      <circle cx={x(li)} cy={y(data[li])} r="3" fill="var(--accent)" />
    </svg>
  );
}
