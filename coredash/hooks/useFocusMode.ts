"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "focus_mode_enabled";
const SYNC_EVENT = "focus-mode-changed";

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // Focus mode still works for the current session when storage is unavailable.
  }
  window.dispatchEvent(new Event(SYNC_EVENT));
}

type FocusSnapshot = { enabled: boolean; mounted: boolean };
const SERVER_SNAPSHOT: FocusSnapshot = { enabled: false, mounted: false };
let snapshot: FocusSnapshot = typeof window === "undefined"
  ? SERVER_SNAPSHOT
  : { enabled: readEnabled(), mounted: true };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onSync = () => {
    snapshot = { enabled: readEnabled(), mounted: true };
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

function updateSnapshot(enabled: boolean) {
  snapshot = { enabled, mounted: true };
  listeners.forEach((listener) => listener());
}

export function useFocusMode() {
  const current = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);

  const setEnabled = useCallback((next: boolean) => {
    updateSnapshot(next);
    writeEnabled(next);
  }, []);

  const toggle = useCallback(() => {
    const next = !snapshot.enabled;
    updateSnapshot(next);
    writeEnabled(next);
  }, []);

  return { enabled: current.enabled, mounted: current.mounted, setEnabled, toggle };
}
