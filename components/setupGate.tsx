"use client";

import { useEffect, useState, type ReactNode } from "react";
import { fetchJson } from "@/lib/api-client";
import type { RuntimeSettingsResponse } from "@/features/settings/types";
import SetupForm from "@/components/setupForm";

export default function SetupGate({ children }: { children: ReactNode }) {
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetchJson<RuntimeSettingsResponse>("/api/settings", { signal: controller.signal });
        if (!controller.signal.aborted) setSetupRequired(response.setupRequired);
      } catch {
        if (!controller.signal.aborted) setSetupRequired(false);
      }
    })();
    return () => controller.abort();
  }, []);

  if (setupRequired === null) return null;
  if (setupRequired) {
    return <SetupForm presentation="screen" onSaved={() => setSetupRequired(false)} />;
  }
  return children;
}
