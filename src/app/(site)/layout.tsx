import { BottomNav } from "@/components/BottomNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isSiteLive } from "@/lib/site";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const live = isSiteLive();
  return (
    <div className="site">
      {!live && <p className="demo-banner">نسخة تجريبية — ملفات «تجريبي» وهمية للعرض</p>}
      <SiteHeader />
      <main id="main" className="container">
        {children}
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
