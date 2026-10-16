"use client";

import { useFocusMode } from "@/hooks/useFocusMode";

export default function FocusModeToggle() {
  const { enabled, toggle } = useFocusMode();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Exit focus mode" : "Enter focus mode"}
      className={`focus-toggle${enabled ? " focus-toggle--active" : ""}`}
    >
      <span aria-hidden="true">◉</span>
      {enabled ? "Focus on" : "Focus"}
    </button>
  );
}
