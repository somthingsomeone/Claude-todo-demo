"use client";

import { useFavorites } from "@/lib/favorites";
import { HeartIcon } from "./Icons";

export function FavoriteButton({ slug, name, className = "fav" }: { slug: string; name: string; className?: string }) {
  const { has, toggle } = useFavorites();
  const saved = has(slug);
  return (
    <button
      type="button"
      className={className}
      aria-pressed={saved}
      aria-label={saved ? `إزالة ${name} من المحفوظات` : `حفظ ${name}`}
      onClick={(e) => {
        // The button sits inside a card link.
        e.preventDefault();
        e.stopPropagation();
        if (!saved) navigator.vibrate?.(10);
        toggle(slug);
      }}
    >
      <HeartIcon filled={saved} size={22} />
    </button>
  );
}
