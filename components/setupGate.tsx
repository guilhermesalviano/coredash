"use client";

import { useEffect, useState, type ReactNode } from "react";
import { fetchJson } from "@/lib/api-client";
import type { RuntimeSettingsResponse } from "@/features/settings/types";
import SetupForm from "@/components/setupForm";

interface SetupGateProps {
  children: ReactNode;
  /** Value resolved on the server. When null or omitted the gate asks the API. */
  initialSetupRequired?: boolean | null;
}

export default function SetupGate({ children, initialSetupRequired = null }: SetupGateProps) {
  const [setupRequired, setSetupRequired] = useState<boolean | null>(initialSetupRequired);

  useEffect(() => {
    if (initialSetupRequired !== null) return;
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
  }, [initialSetupRequired]);

  if (setupRequired === null) return null;
  if (setupRequired) {
    return <SetupForm presentation="screen" onSaved={() => setSetupRequired(false)} />;
  }
  return children;
}
