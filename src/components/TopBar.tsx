import Link from "next/link";

/** White top bar: the wordmark (supplied artwork, untouched) and a link for first-time visitors. */
export function TopBar() {
  return (
    <header className="topbar">
      <div className="wrap topbar__inner">
        <Link href="/" className="topbar__brand" aria-label="بانيفو — الرئيسية">
          <img src="/brand/wordmark-header.webp" alt="بانيفو" width={87} height={28} />
        </Link>
        <Link href="/intro" className="shelf__more">
          ما هو بانيفو؟
        </Link>
      </div>
    </header>
  );
}
