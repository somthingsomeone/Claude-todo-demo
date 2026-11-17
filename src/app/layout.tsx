import type { Metadata, Viewport } from "next";
// Readex Pro, self-hosted with the site (no outside font services).
import "@fontsource-variable/readex-pro/wght.css";
import "./globals.css";
import { OG_IMAGE } from "@/lib/seo";
import { isSiteLive, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/site";

export function generateMetadata(): Metadata {
  const live = isSiteLive();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: `%s · ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    // Until launch (SITE_LIVE=true) the whole site stays out of search engines.
    robots: live ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { type: "website", locale: "ar_SA", siteName: SITE_NAME, images: [OG_IMAGE] },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
