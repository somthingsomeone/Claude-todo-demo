"use client";

import { useFavorites } from "@/lib/favorites";
import { TrashIcon } from "./Icons";

export function ClearFavorites() {
  const { ids, clear } = useFavorites();
  return (
    <button
      type="button"
      className="menu__item menu__item--danger"
      disabled={ids.length === 0}
      onClick={() => {
        if (window.confirm("تبي تمسح كل المفضلة من هذا الجهاز؟")) clear();
      }}
    >
      <span className="menu__icon">
        <TrashIcon size={20} />
      </span>
      مسح المفضلة من هذا الجهاز
      <span className="menu__chev muted">{ids.length}</span>
    </button>
  );
}
