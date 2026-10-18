import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { PinIcon } from "@/components/Icons";
import { Wordmark } from "@/components/Logo";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <p className="demo-banner">نسخة تجريبية — ملفات «تجريبي» وهمية للعرض</p>
      <header className="site-header container">
        <Link href="/" className="site-header__brand" aria-label="باناكس — الرئيسية">
          <Wordmark height={28} />
        </Link>
        <span className="pill pill--glass site-header__city">
          <PinIcon size={16} />
          الرياض
        </span>
      </header>
      <main id="main" className="container">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
