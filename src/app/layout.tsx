import type { Metadata, Viewport } from "next";
import Link from "next/link";
// Fonts are bundled with the site (no calls to outside font services).
import "@fontsource/readex-pro/arabic-400.css";
import "@fontsource/readex-pro/arabic-500.css";
import "@fontsource/readex-pro/arabic-600.css";
import "@fontsource/readex-pro/arabic-700.css";
import "@fontsource/readex-pro/latin-400.css";
import "@fontsource/readex-pro/latin-600.css";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { Wordmark } from "@/components/Logo";
import { PinIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: { default: "باناكس — اعرف طبيبك قبل موعدك", template: "%s · باناكس" },
  description: "دليل بسيط لأطباء وأخصائيين سعوديين في الرياض: جلدية، تجميل وليزر، عيون، أسنان، وعلاج طبيعي.",
  robots: { index: false, follow: false }, // stays hidden from search engines until launch
};

export const viewport: Viewport = {
  themeColor: "#EEF3FC",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="bg-blobs" aria-hidden="true" />
        <p className="demo-banner">نسخة تجريبية — الأطباء والتقييمات هنا وهمية للعرض فقط</p>
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
      </body>
    </html>
  );
}
