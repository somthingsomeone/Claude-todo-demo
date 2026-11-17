"use client";

import { useFavorites } from "@/lib/favorites";
import { TrashIcon } from "./Icons";

/** Shown only when there is something to clear (an empty, disabled red row reads as an error). */
export function ClearFavorites() {
  const { ids, clear } = useFavorites();
  if (ids.length === 0) return null;
  return (
    <ul className="group">
      <li>
        <button
          type="button"
          className="row row--link row--danger"
          onClick={() => {
            // Destructive and not undoable, so this is one of the few places that asks first.
            if (window.confirm("هل تريد مسح جميع المحفوظات من هذا الجهاز؟")) clear();
          }}
        >
          <span className="row__icon">
            <TrashIcon size={18} />
          </span>
          <span className="row__text">مسح المحفوظات من هذا الجهاز ({ids.length})</span>
        </button>
      </li>
    </ul>
  );
}
