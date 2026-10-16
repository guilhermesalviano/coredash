"use client";

import { getSnapshot, subscribe } from "@/lib/dashboardStore";
import { useSyncExternalStore } from "react";

export function useDashboard() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}