"use client";

import { useState } from "react";
import { useFavorites } from "@/lib/favorites";
import { HeartIcon } from "./Icons";

export function FavoriteButton({ slug, name, className }: { slug: string; name: string; className?: string }) {
  const { has, toggle } = useFavorites();
  const saved = has(slug);
  // Bumped on each save so the heart "pops" exactly when it fills (same frame as the haptic).
  const [pop, setPop] = useState(0);
  return (
    <button
      type="button"
      className={`fav-btn ${saved ? "is-saved" : ""} ${className ?? ""}`}
      aria-pressed={saved}
      aria-label={saved ? `إزالة ${name} من المفضلة` : `حفظ ${name} في المفضلة`}
      onClick={(e) => {
        // The button sits inside a card link.
        e.preventDefault();
        e.stopPropagation();
        if (!saved) {
          setPop((n) => n + 1);
          navigator.vibrate?.(10);
        }
        toggle(slug);
      }}
    >
      <HeartIcon key={pop} filled={saved} size={20} className={pop > 0 && saved ? "pop" : undefined} />
    </button>
  );
}
