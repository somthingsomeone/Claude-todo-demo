import type { Metadata, Viewport } from "next";
// Fonts are bundled with the site (no calls to outside font services).
import "@fontsource/readex-pro/arabic-400.css";
import "@fontsource/readex-pro/arabic-500.css";
import "@fontsource/readex-pro/arabic-600.css";
import "@fontsource/readex-pro/arabic-700.css";
import "@fontsource/readex-pro/latin-400.css";
import "@fontsource/readex-pro/latin-600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "باناكس — اعرف طبيبك قبل موعدك", template: "%s · باناكس" },
  description: "دليل بسيط لأطباء وأخصائيين في الرياض: جلدية، تجميل وليزر، عيون، أسنان، وعلاج طبيعي.",
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
        {children}
      </body>
    </html>
  );
}
