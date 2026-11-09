"use client";

import { getSnapshot, subscribe } from "@/lib/dashboardStore";
import type { DashboardStore } from "@/features/dashboard/types";
import { useCallback, useSyncExternalStore } from "react";

export function useDashboard() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Subscribes to one slice. The store replaces only the slice that changed, so
 * a weather card is not re-rendered when stocks or news update.
 */
export function useDashboardSlice<K extends keyof DashboardStore>(key: K): DashboardStore[K] {
  const getSlice = useCallback(() => getSnapshot()[key], [key]);
  return useSyncExternalStore(subscribe, getSlice, getSlice);
}
