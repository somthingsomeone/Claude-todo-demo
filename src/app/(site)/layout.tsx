import { BottomNav } from "@/components/BottomNav";
import { SiteHeader } from "@/components/SiteHeader";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <p className="demo-banner">نسخة تجريبية — ملفات «تجريبي» وهمية للعرض</p>
      <SiteHeader />
      <main id="main" className="container">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
