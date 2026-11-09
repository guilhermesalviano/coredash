"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import Loading from "@/components/loading";
import ActionLoader from "@/components/actionLoader";
import Clock from "@/components/clock";
import SystemsStatus from "@/components/systemsStatus";
import ActiveCards from "@/components/activeCards";
import Logo from "@/components/logo";
import Settings from "@/components/settings";
import StoreStatusBridge from "@/components/storeStatusBridge";
import FocusModeToggle from "@/components/focusModeToggle";
import ProjectQrButton from "@/components/projectQrButton";
import SetupGate from "@/components/setupGate";
import { useViewMode } from "@/hooks/useViewMode";
import type { DashboardSeed } from "@/features/dashboard/types";

// Focus mode is opt-in, so its code is only downloaded when it is switched on.
const FocusMode = dynamic(() => import("@/components/focusMode"), { ssr: false });

interface DashboardShellProps {
  /** Null when the server could not read the settings; the gate then asks the API. */
  setupRequired: boolean | null;
  seed: DashboardSeed;
  loadingGif: string | null;
}

export default function DashboardShell({ setupRequired, seed, loadingGif }: DashboardShellProps) {
  const { mode, mounted } = useViewMode();

  // Lets the stylesheet size the focus shell against the real header height
  // instead of a hardcoded viewport offset.
  useEffect(() => {
    if (!mounted || mode !== "focus") return;
    document.body.dataset.focus = "on";
    return () => {
      delete document.body.dataset.focus;
    };
  }, [mode, mounted]);

  return (
    <SetupGate initialSetupRequired={setupRequired}>
    <>
      <Loading gif={loadingGif} />
      <StoreStatusBridge seed={seed} />
      <ActionLoader />
      <div className="header grid grid-cols-3 items-center w-full py-4! sm:px-14! sticky z-60">
        <div className="header-brand flex gap-2 items-center">
          <Logo />
        </div>

        <div className="header-clock flex justify-center">
          <Clock />
        </div>

        <div className="header-status flex items-center justify-end gap-4">
          <SystemsStatus />
          <FocusModeToggle />
          <Settings />
        </div>
      </div>
      {mounted && mode === "focus" ? (
        <FocusMode />
      ) : (
        <ActiveCards />
      )}
      <ProjectQrButton />
    </>
    </SetupGate>
  );
}
