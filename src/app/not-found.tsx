import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap page">
      <Link href="/" aria-label="بانيفو — الرئيسية">
        <img src="/brand/wordmark-header.webp" alt="بانيفو" width={87} height={28} />
      </Link>
      <div className="empty">
        <p className="empty__title">الصفحة غير موجودة</p>
        <p className="muted">ربما تغيّر الرابط أو كُتب بشكل غير صحيح.</p>
        <Link href="/" className="btn">
          العودة إلى الرئيسية
        </Link>
      </div>
    </main>
  );
}
