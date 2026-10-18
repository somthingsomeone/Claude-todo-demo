import { redirect } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import { authMode, getCurrentAdmin } from "@/lib/admin/session";
import { devLogin, requestLoginLink } from "../actions";

export const metadata = { title: "دخول المشرفين", robots: { index: false } };

export default async function LoginPage(props: PageProps<"/admin/login">) {
  const params = await props.searchParams;
  if (await getCurrentAdmin()) redirect("/admin");
  const mode = authMode();
  return (
    <main className="container adm-login">
      <div className="glass card adm-login__box">
        <LogoMark size={44} />
        <h1>دخول المشرفين</h1>
        {mode === "supabase" &&
          (params.sent ? (
            <p className="flash flash--ok">إذا كان هذا البريد مسجلًا كمشرف، بيوصلك رابط الدخول خلال دقائق.</p>
          ) : (
            <form action={requestLoginLink} className="form">
              {params.failed && <p className="flash flash--err">الرابط انتهى أو ما اشتغل. اطلب رابط جديد.</p>}
              <label className="field">
                <span>البريد الإلكتروني</span>
                <input name="email" type="email" required dir="ltr" autoComplete="email" />
              </label>
              <button className="btn-primary">أرسل لي رابط الدخول</button>
              <p className="muted">ما فيه كلمة مرور. يوصلك رابط دخول آمن على بريدك.</p>
            </form>
          ))}
        {mode === "dev" && (
          <form action={devLogin} className="form">
            <p className="flash flash--warn">وضع التطوير على جهاز محلي. هذا الزر ما يشتغل أبدًا على الموقع الحقيقي.</p>
            <button className="btn-primary">دخول تجريبي كمالك</button>
          </form>
        )}
        {mode === "disabled" && <p className="muted">لوحة الإدارة غير مفعّلة بعد. تتفعّل عند ربط Supabase.</p>}
      </div>
    </main>
  );
}
