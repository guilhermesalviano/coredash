"use client";

import { useEffect } from "react";
import { hydrateDashboard, subscribe, getSnapshot } from "@/lib/dashboardStore";
import type { DashboardSeed } from "@/features/dashboard/types";
import { useStatus } from "@/contexts/statusContext";

type ServiceStatus = "loading" | "success" | "error";

const toServiceStatus = (s: string): ServiceStatus | null =>
  s === "idle" ? null : (s as ServiceStatus);

/**
 * Subscribes to dashboardStore and forwards each slice's status
 * into statusContext so the loading screen waits for all data.
 * It is the first subscriber, so it also applies the server seed.
 */
export default function StoreStatusBridge({ seed }: { seed?: DashboardSeed }) {
  const { reportStatus } = useStatus();

  useEffect(() => {
    // Must run before the first subscription, which starts the fetches.
    if (seed) hydrateDashboard(seed);

    const sync = () => {
      const snap = getSnapshot();
      for (const key of ["weather", "news", "stocks"] as const) {
        const slice = snap[key];
        // A refresh of data that is already on screen is not a loading state.
        const status = slice.status === "loading" && slice.data ? "success" : toServiceStatus(slice.status);
        if (status) reportStatus(key, status);
      }
    };

    const unsub = subscribe(sync);
    sync();
    return unsub;
  }, [reportStatus, seed]);

  return null;
}
