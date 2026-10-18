"use client";

import { WhatsAppIcon } from "./Icons";

/** Opens WhatsApp with the prefilled message and counts the click (count + date only). */
export function WhatsAppButton({ slug, href }: { slug: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-whatsapp"
      onClick={() => {
        const url = `/api/clicks/${encodeURIComponent(slug)}`;
        if (!navigator.sendBeacon?.(url)) fetch(url, { method: "POST", keepalive: true }).catch(() => {});
      }}
    >
      <WhatsAppIcon size={22} />
      تواصل عبر واتساب
    </a>
  );
}
