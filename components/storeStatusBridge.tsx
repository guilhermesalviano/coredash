"use client";

import { useEffect } from "react";
import { subscribe, getSnapshot } from "@/lib/dashboardStore";
import { useStatus } from "@/contexts/statusContext";

type ServiceStatus = "loading" | "success" | "error";

const toServiceStatus = (s: string): ServiceStatus | null =>
  s === "idle" ? null : (s as ServiceStatus);

/**
 * Subscribes to dashboardStore and forwards each slice's status
 * into statusContext so the loading screen waits for all data.
 */
export default function StoreStatusBridge() {
  const { reportStatus } = useStatus();

  useEffect(() => {
    const sync = () => {
      const snap = getSnapshot();
      for (const key of ["weather", "news", "stocks"] as const) {
        const status = toServiceStatus(snap[key].status);
        if (status) reportStatus(key, status);
      }
    };

    const unsub = subscribe(sync);
    sync();
    return unsub;
  }, []);

  return null;
}
