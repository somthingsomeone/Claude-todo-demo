import { redirect } from "next/navigation";
import { authMode, getCurrentAdmin } from "@/lib/admin/session";
import { devLogin, requestLoginLink } from "../actions";

export const metadata = { title: "دخول المشرفين", robots: { index: false } };

export default async function LoginPage(props: PageProps<"/admin/login">) {
  const params = await props.searchParams;
  if (await getCurrentAdmin()) redirect("/admin");
  const mode = authMode();
  return (
    <main className="adm-login">
      <div className="group adm-login__box">
        <img src="/brand/wordmark-header.webp" alt="بانيفو" width={109} height={35} />
        <h1>دخول المشرفين</h1>
        {mode === "supabase" &&
          (params.sent ? (
            <p className="flash flash--ok">إن كان هذا البريد مسجَّلًا لمشرف، فسيصلك رابط الدخول خلال دقائق.</p>
          ) : (
            <form action={requestLoginLink} className="form">
              {params.failed && <p className="flash flash--err">انتهت صلاحية الرابط أو لم يعمل. اطلب رابطًا جديدًا.</p>}
              <label className="field">
                <span>البريد الإلكتروني</span>
                <input name="email" type="email" required dir="ltr" autoComplete="email" />
              </label>
              <button className="btn">أرسل رابط الدخول</button>
              <p className="muted">لا توجد كلمة مرور، بل يصلك رابط دخول آمن على بريدك.</p>
            </form>
          ))}
        {mode === "dev" && (
          <form action={devLogin} className="form">
            <p className="flash flash--warn">وضع التطوير على جهاز محلي. لا يعمل هذا الزر أبدًا على الموقع الحقيقي.</p>
            <button className="btn">دخول تجريبي بصلاحية المالك</button>
          </form>
        )}
        {mode === "disabled" && <p className="muted">لوحة الإدارة غير مفعّلة بعد، وتُفعَّل عند ربط Supabase.</p>}
      </div>
    </main>
  );
}
