"use client";

import { useFocusMode } from "@/hooks/useFocusMode";
import { useLocale } from "@/contexts/localeContext";

export default function FocusModeToggle() {
  const { enabled, toggle } = useFocusMode();
  const { t } = useLocale();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? t("exitFocus") : t("enterFocus")}
      className={`focus-toggle${enabled ? " focus-toggle--active" : ""}`}
    >
      <span aria-hidden="true">◉</span>
      {enabled ? t("focusOn") : t("focus")}
    </button>
  );
}
