"use client";

import { useViewMode } from "./useViewMode";

export function useFocusMode() {
  const { mode, mounted, setViewMode, toggleFocus } = useViewMode();
  return {
    enabled: mode === "focus",
    mounted,
    setEnabled: (enabled: boolean) => setViewMode(enabled ? "focus" : "dashboard"),
    toggle: toggleFocus,
  };
}
