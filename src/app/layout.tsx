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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f1a" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const THEME_SCRIPT = `try{var t=localStorage.getItem("panivo-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* The visitor's theme choice (Settings → المظهر), applied before the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
