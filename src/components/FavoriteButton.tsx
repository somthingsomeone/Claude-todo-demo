"use client";

import { useFavorites } from "@/lib/favorites";
import { HeartIcon } from "./Icons";

export function FavoriteButton({ slug, name, className }: { slug: string; name: string; className?: string }) {
  const { has, toggle } = useFavorites();
  const saved = has(slug);
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
        toggle(slug);
      }}
    >
      <HeartIcon filled={saved} size={20} />
    </button>
  );
}
