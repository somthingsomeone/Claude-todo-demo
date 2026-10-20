import type { Metadata, Viewport } from "next";
// Uses the device's system font (SF Arabic on Apple devices) — no web fonts to download.
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "باناكس — اعرف طبيبك قبل موعدك", template: "%s · باناكس" },
  description: "دليل بسيط لأطباء وأخصائيين في الرياض: جلدية، تجميل وليزر، عيون، أسنان، وعلاج طبيعي.",
  robots: { index: false, follow: false }, // stays hidden from search engines until launch
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2F2F7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  );
}
