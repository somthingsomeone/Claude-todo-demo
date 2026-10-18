/**
 * Panax logos (approved by the owner): the P mark — separate bar, D-shaped bowl and
 * solid circle — in a light-to-deep blue gradient, and the "panax" wordmark built on it.
 * Identical gradient ids across instances are fine: the definitions are the same.
 */

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="-2 -2 134 134"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="باناكس"
    >
      <defs>
        <linearGradient id="panax-mark-g" x1="0" y1="0" x2="130" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1AAEFF" />
          <stop offset="0.55" stopColor="#1E6BFF" />
          <stop offset="1" stopColor="#0B2DB4" />
        </linearGradient>
      </defs>
      <g fill="url(#panax-mark-g)">
        <rect x="0" y="0" width="26" height="130" />
        <path d="M34 0H65A50 50 0 0 1 65 100H34V80H65A30 30 0 0 0 65 20H34Z" />
        <circle cx="55" cy="50" r="21" />
      </g>
    </svg>
  );
}

export function Wordmark({ height = 30, className }: { height?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 593 130"
      height={height}
      width={(height * 593) / 130}
      className={className}
      role="img"
      aria-label="باناكس panax"
      style={{ direction: "ltr" }}
    >
      <defs>
        <linearGradient id="panax-word-g" x1="0" y1="0" x2="593" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3FA6FF" />
          <stop offset="1" stopColor="#1C4EE6" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="26" height="130" fill="url(#panax-word-g)" />
      <path d="M34 0H65A50 50 0 0 1 65 100H34V80H65A30 30 0 0 0 65 20H34Z" fill="url(#panax-word-g)" />
      <circle cx="55" cy="50" r="21" fill="url(#panax-word-g)" />
      <g transform="translate(15 0)">
        <g fill="none" stroke="url(#panax-word-g)" strokeWidth="22">
          <circle cx="168" cy="50" r="39" />
          <path d="M207 0V100" />
          <path d="M247 0V100" />
          <path d="M247 50A39 39 0 0 1 325 50V100" />
          <circle cx="404" cy="50" r="39" />
          <path d="M443 0V100" />
        </g>
        <g fill="url(#panax-word-g)">
          <polygon points="472,0 500,0 578,100 550,100" />
          <polygon points="550,0 578,0 500,100 472,100" />
        </g>
      </g>
    </svg>
  );
}
