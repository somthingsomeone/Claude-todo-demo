import { BottomNav } from "@/components/BottomNav";
import { SiteFooter } from "@/components/SiteFooter";
import { TopBar } from "@/components/TopBar";
import { isSiteLive } from "@/lib/site";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const live = isSiteLive();
  return (
    <div className="site">
      {!live && <p className="demo-note">نسخة تجريبية: الملفات المعلَّمة «تجريبي» للعرض فقط.</p>}
      <TopBar />
      <main id="main">{children}</main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
