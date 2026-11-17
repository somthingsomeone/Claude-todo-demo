/** Formats YYYY-MM-DD as 2026/10/18 (Latin digits, as on Saudi forms). */
export function stampDate(iso: string) {
  return iso.replaceAll("-", "/");
}

/**
 * The verification stamp: PANIVO's signature. An ink-blue seal that vouches for a
 * profile — the doctor consented to be listed, and the facts were last checked on
 * this date. It presses onto the slip as it enters view (static under reduced motion).
 */
export function Stamp({ checkedAt, large = false }: { checkedAt: string; large?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`stamp${large ? " stamp--lg" : ""}`}
      role="img"
      aria-label={`ملف موثّق بموافقة الطبيب، آخر تحقق ${stampDate(checkedAt)}`}
    >
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="50" cy="50" r="39" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M41 30l6.5 6.5L60 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <text x="50" y="57" textAnchor="middle" fontSize="15" fontWeight="700" fill="currentColor">
        موثّق
      </text>
      <text x="50" y="73" textAnchor="middle" fontSize="11" fontWeight="600" fill="currentColor" style={{ direction: "ltr" }}>
        {stampDate(checkedAt)}
      </text>
    </svg>
  );
}
