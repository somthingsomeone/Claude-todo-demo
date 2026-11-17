import { contactEmail } from "@/lib/site";
import { Placeholder } from "./Placeholder";

/** The contact email as a mail link, or a highlighted blank until CONTACT_EMAIL is set. */
export function ContactEmail({ subject, body }: { subject?: string; body?: string }) {
  const email = contactEmail();
  if (!email) return <Placeholder>إيميل التواصل</Placeholder>;
  const q = new URLSearchParams();
  if (subject) q.set("subject", subject);
  if (body) q.set("body", body);
  const query = q.toString().replace(/\+/g, "%20");
  return (
    <a href={`mailto:${email}${query ? `?${query}` : ""}`} className="link" dir="ltr">
      {email}
    </a>
  );
}
