"use client";

import { useState } from "react";
import { CheckIcon, ShareIcon } from "./Icons";

/** Native share sheet where available; otherwise copies the link and confirms. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="action"
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) {
          await navigator.share({ title, url }).catch(() => {});
          return;
        }
        await navigator.clipboard?.writeText(url).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
    >
      <span className="action__icon">{copied ? <CheckIcon size={22} /> : <ShareIcon size={22} />}</span>
      <span className="action__label">{copied ? "تم النسخ" : "مشاركة"}</span>
    </button>
  );
}
