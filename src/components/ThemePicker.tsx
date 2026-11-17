"use client";

import { useEffect, useState } from "react";

const KEY = "panivo-theme";
const OPTIONS = [
  { value: "auto", label: "تلقائي" },
  { value: "light", label: "فاتح" },
  { value: "dark", label: "داكن" },
] as const;
type Theme = (typeof OPTIONS)[number]["value"];

/** Light, dark, or follow the phone. Saved on this device only. */
export function ThemePicker() {
  const [theme, setTheme] = useState<Theme>("auto");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {}
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    try {
      if (next === "auto") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {}
    if (next === "auto") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
  }

  return (
    <fieldset className="segmented">
      <legend className="segmented__legend">المظهر</legend>
      <div className="segmented__track">
        {OPTIONS.map((o) => (
          <label key={o.value} className="segmented__item">
            <input type="radio" name="theme" value={o.value} checked={theme === o.value} onChange={() => choose(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
