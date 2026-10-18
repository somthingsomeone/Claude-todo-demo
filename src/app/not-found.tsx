import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page">
      <div className="empty glass">
        <p className="empty__title">الصفحة غير موجودة</p>
        <p>يمكن الرابط قديم أو فيه خطأ.</p>
        <Link href="/" className="btn-primary">
          الرئيسية
        </Link>
      </div>
    </section>
  );
}
