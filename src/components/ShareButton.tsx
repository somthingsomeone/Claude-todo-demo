"use client";

import { useState } from "react";
import { CheckIcon, ShareIcon } from "./Icons";

/** Native share sheet where available; otherwise copies the link and confirms. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="round-btn"
      aria-label={copied ? "نُسخ الرابط" : "مشاركة"}
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
      {copied ? <CheckIcon size={20} /> : <ShareIcon size={20} />}
    </button>
  );
}
