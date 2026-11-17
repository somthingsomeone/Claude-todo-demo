/**
 * The supplied wordmark, untouched: the artwork made for white on light screens,
 * the transparent artwork on dark screens (globals.css swaps them by theme).
 */
export function Wordmark({ width = 87, height = 28 }: { width?: number; height?: number }) {
  return (
    <>
      <img className="logo-light" src="/brand/wordmark-header.webp" alt="بانيفو" width={width} height={height} />
      <img className="logo-dark" src="/brand/wordmark-footer.webp" alt="بانيفو" width={width} height={height} />
    </>
  );
}
