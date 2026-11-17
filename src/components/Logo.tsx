/**
 * PANIVO logos: the owner's P mark — separate bar, D-shaped bowl and solid circle — in a
 * light-to-deep blue gradient, and the lowercase "panivo" wordmark built on it.
 * Wordmark geometry: x-height 0–100, 22-unit strokes, 18-unit letter gaps, the i dot above
 * the x-height and the p bar as the only descender. Identical gradient ids across
 * instances are fine: the definitions are the same.
 */

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="-2 -2 134 134"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="بانيفو"
    >
      <defs>
        <linearGradient id="panivo-mark-g" x1="0" y1="0" x2="130" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1AAEFF" />
          <stop offset="0.55" stopColor="#1E6BFF" />
          <stop offset="1" stopColor="#0B2DB4" />
        </linearGradient>
      </defs>
      <g fill="url(#panivo-mark-g)">
        <rect x="0" y="0" width="26" height="130" />
        <path d="M34 0H65A50 50 0 0 1 65 100H34V80H65A30 30 0 0 0 65 20H34Z" />
        <circle cx="55" cy="50" r="21" />
      </g>
    </svg>
  );
}

const WORD_W = 631;
const WORD_H = 166;

export function Wordmark({ height = 30, className }: { height?: number; className?: string }) {
  return (
    <svg
      viewBox={`0 -36 ${WORD_W} ${WORD_H}`}
      height={height}
      width={(height * WORD_W) / WORD_H}
      className={className}
      role="img"
      aria-label="بانيفو PANIVO"
      style={{ direction: "ltr" }}
    >
      <defs>
        <linearGradient id="panivo-word-g" x1="0" y1="0" x2={WORD_W} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3FA6FF" />
          <stop offset="1" stopColor="#1C4EE6" />
        </linearGradient>
      </defs>
      <g fill="url(#panivo-word-g)">
        <rect x="0" y="0" width="26" height="130" />
        <path d="M34 0H65A50 50 0 0 1 65 100H34V80H65A30 30 0 0 0 65 20H34Z" />
        <circle cx="55" cy="50" r="21" />
      </g>
      <g transform="translate(15 0)">
        <g fill="none" stroke="url(#panivo-word-g)" strokeWidth="22">
          {/* a */}
          <circle cx="168" cy="50" r="39" />
          <path d="M207 0V100" />
          {/* n */}
          <path d="M247 0V100" />
          <path d="M247 50A39 39 0 0 1 325 50V100" />
          {/* i */}
          <path d="M365 0V100" />
          {/* o */}
          <circle cx="566" cy="50" r="39" />
        </g>
        <g fill="url(#panivo-word-g)">
          {/* i dot */}
          <circle cx="365" cy="-25" r="11" />
          {/* v: 24-unit arms so the diagonal reads as the same 22-unit stroke */}
          <polygon points="394,0 418,0 458,100 434,100" />
          <polygon points="474,0 498,0 458,100 434,100" />
        </g>
      </g>
    </svg>
  );
}
