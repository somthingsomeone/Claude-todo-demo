"use client";

import { WhatsAppIcon } from "./Icons";

/** Opens WhatsApp with the prefilled message and counts the click (count + date only). */
export function WhatsAppButton({
  slug,
  href,
  label,
  className,
}: {
  slug: string;
  href: string | null;
  label: string;
  className: string;
}) {
  if (!href) {
    return (
      <span className={className} aria-disabled="true">
        <WhatsAppIcon size={18} />
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        const url = `/api/clicks/${encodeURIComponent(slug)}`;
        if (!navigator.sendBeacon?.(url)) fetch(url, { method: "POST", keepalive: true }).catch(() => {});
      }}
    >
      <WhatsAppIcon size={20} />
      {label}
    </a>
  );
}
