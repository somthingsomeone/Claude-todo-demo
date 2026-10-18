import { StarIcon } from "./Icons";

/** Five stars filled to the rating (out of 5). */
export function Stars({ rating, size = 18 }: { rating: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  const row = (filled: boolean) =>
    Array.from({ length: 5 }, (_, i) => <StarIcon key={i} size={size} filled={filled} />);
  return (
    <span className="stars" role="img" aria-label={`التقييم ${rating.toFixed(1)} من 5`}>
      <span className="stars__base">{row(false)}</span>
      <span className="stars__fill" style={{ inlineSize: `${pct}%` }}>
        {row(true)}
      </span>
    </span>
  );
}
