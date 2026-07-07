import { CONFIDENCE } from "../data/index.js";

export default function Legend() {
  return (
    <div className="legend" role="note" aria-label="Confidence legend">
      {Object.values(CONFIDENCE).map((c) => (
        <span className="k" key={c.label}>
          <span className="dot" style={{ background: c.color }} />
          {c.label} <span className="cap">({c.desc})</span>
        </span>
      ))}
    </div>
  );
}
