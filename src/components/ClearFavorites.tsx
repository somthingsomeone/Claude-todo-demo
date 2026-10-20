"use client";

import { useFavorites } from "@/lib/favorites";
import { TrashIcon } from "./Icons";

export function ClearFavorites() {
  const { ids, clear } = useFavorites();
  return (
    <button
      type="button"
      className="row row--link row--danger"
      disabled={ids.length === 0}
      onClick={() => {
        // Destructive and not undoable, so this is one of the few places that asks first.
        if (window.confirm("تبي تمسح كل المفضلة من هذا الجهاز؟")) clear();
      }}
    >
      <span className="row__icon tile tile--red">
        <TrashIcon size={18} />
      </span>
      <span className="row__text">مسح المفضلة من هذا الجهاز</span>
      <span className="row__value">{ids.length}</span>
    </button>
  );
}
