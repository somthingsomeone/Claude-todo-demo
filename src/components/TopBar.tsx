import Link from "next/link";
import { TopNav } from "./TopNav";

/**
 * White top bar: the wordmark (supplied artwork, untouched) at the start; at the end a link for
 * first-time visitors and the saved doctors. On wide screens it also carries the three tabs.
 */
export function TopBar() {
  return (
    <header className="topbar">
      <div className="wrap topbar__inner">
        <Link href="/" className="topbar__brand" aria-label="بانيفو — الرئيسية">
          <img src="/brand/wordmark-header.webp" alt="بانيفو" width={87} height={28} />
        </Link>
        <TopNav />
      </div>
    </header>
  );
}
