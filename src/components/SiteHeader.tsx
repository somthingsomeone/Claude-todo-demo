"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PinIcon } from "./Icons";
import { Wordmark } from "./Logo";

/**
 * Translucent navigation bar. Content scrolls underneath it; the material and the
 * soft edge only appear once content actually goes under the bar (scroll edge effect).
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className="navbar" data-scrolled={scrolled || undefined}>
      <div className="container navbar__inner">
        <Link href="/" className="navbar__brand" aria-label="باناكس — الرئيسية">
          <Wordmark height={24} />
        </Link>
        <span className="navbar__city">
          <PinIcon size={15} />
          الرياض
        </span>
      </div>
    </header>
  );
}
