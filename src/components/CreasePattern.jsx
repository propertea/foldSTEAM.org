/*
 * A crane (bird base) crease pattern, drawn as thin ink lines.
 * Mountain folds: solid ink. Valley folds: dashed crane red.
 * Used as the hero's background motif and as the placeholder
 * where an image hasn't been uploaded yet.
 */
export default function CreasePattern({ className = "" }) {
  const S = 400;
  const C = S / 2;
  return (
    <svg
      className={`crease-pattern ${className}`.trim()}
      viewBox={`0 0 ${S} ${S}`}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="1" width={S - 2} height={S - 2} className="cp-edge" />
      {/* diagonals (mountain) */}
      <line x1="0" y1="0" x2={S} y2={S} className="cp-mountain" />
      <line x1={S} y1="0" x2="0" y2={S} className="cp-mountain" />
      {/* book folds (valley) */}
      <line x1={C} y1="0" x2={C} y2={S} className="cp-valley" />
      <line x1="0" y1={C} x2={S} y2={C} className="cp-valley" />
      {[
        // petal-fold creases: corner -> opposite edge midpoints
        [0, 0, S, C], [0, 0, C, S],
        [S, 0, 0, C], [S, 0, C, S],
        [0, S, C, 0], [0, S, S, C],
        [S, S, C, 0], [S, S, 0, C],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="cp-valley" />
      ))}
      {/* inner square (mountain) */}
      <path
        d={`M ${C} 0 L ${S} ${C} L ${C} ${S} L 0 ${C} Z`}
        className="cp-mountain"
        fill="none"
      />
    </svg>
  );
}
