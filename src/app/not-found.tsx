import Link from "next/link";
import { Wordmark } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="container page">
      <Link href="/" aria-label="باناكس — الرئيسية" className="site-header__brand">
        <Wordmark height={28} />
      </Link>
      <div className="empty glass">
        <p className="empty__title">الصفحة غير موجودة</p>
        <p>يمكن الرابط قديم أو فيه خطأ.</p>
        <Link href="/" className="btn-primary">
          الرئيسية
        </Link>
      </div>
    </main>
  );
}
