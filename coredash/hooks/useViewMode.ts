"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ViewMode = "dashboard" | "focus" | "kanban";

const STORAGE_KEY = "coredash_view_mode";
const LEGACY_FOCUS_KEY = "focus_mode_enabled";
const SYNC_EVENT = "coredash-view-mode-changed";

function readMode(): ViewMode {
  try {
    const mode = localStorage.getItem(STORAGE_KEY);
    if (mode === "focus" || mode === "kanban" || mode === "dashboard") {
      return mode;
    }
    if (localStorage.getItem(LEGACY_FOCUS_KEY) === "true") {
      return "focus";
    }
    return "dashboard";
  } catch {
    return "dashboard";
  }
}

function writeMode(mode: ViewMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
    localStorage.setItem(LEGACY_FOCUS_KEY, String(mode === "focus"));
  } catch {
    // Mode still works for current session if storage is unavailable
  }
  window.dispatchEvent(new Event(SYNC_EVENT));
}

type ModeSnapshot = { mode: ViewMode; mounted: boolean };
const SERVER_SNAPSHOT: ModeSnapshot = { mode: "dashboard", mounted: false };
let snapshot: ModeSnapshot =
  typeof window === "undefined"
    ? SERVER_SNAPSHOT
    : { mode: readMode(), mounted: true };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onSync = () => {
    snapshot = { mode: readMode(), mounted: true };
    listener();
  };
  window.addEventListener(SYNC_EVENT, onSync);
  return () => {
    listeners.delete(listener);
    window.removeEventListener(SYNC_EVENT, onSync);
  };
}

function getSnapshot() {
  return snapshot;
}

function updateSnapshot(mode: ViewMode) {
  snapshot = { mode, mounted: true };
  listeners.forEach((listener) => listener());
}

export function useViewMode() {
  const current = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);

  const setViewMode = useCallback((next: ViewMode) => {
    updateSnapshot(next);
    writeMode(next);
  }, []);

  const toggleFocus = useCallback(() => {
    const next: ViewMode = snapshot.mode === "focus" ? "dashboard" : "focus";
    updateSnapshot(next);
    writeMode(next);
  }, []);

  const toggleKanban = useCallback(() => {
    const next: ViewMode = snapshot.mode === "kanban" ? "dashboard" : "kanban";
    updateSnapshot(next);
    writeMode(next);
  }, []);

  return {
    mode: current.mode,
    mounted: current.mounted,
    setViewMode,
    toggleFocus,
    toggleKanban,
  };
}
