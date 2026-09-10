"use client";

import { useEffect } from "react";
import Loading from "@/components/loading";
import ActionLoader from "@/components/actionLoader";
import Clock from "@/components/clock";
import SystemsStatus from "@/components/systemsStatus";
import ActiveCards from "@/components/activeCards";
import Logo from "@/components/logo";
import Settings from "@/components/settings";
import StoreStatusBridge from "@/components/storeStatusBridge";
import FocusMode from "@/components/focusMode";
import FocusModeToggle from "@/components/focusModeToggle";
import { useFocusMode } from "@/hooks/useFocusMode";

export default function Page() {
  const { enabled, mounted } = useFocusMode();

  // Lets the stylesheet size the focus shell against the real header height
  // instead of a hardcoded viewport offset.
  useEffect(() => {
    if (!mounted || !enabled) return;
    document.body.dataset.focus = "on";
    return () => {
      delete document.body.dataset.focus;
    };
  }, [enabled, mounted]);

  return (
    <>
      <Loading />
      <StoreStatusBridge />
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
      {mounted && enabled ? <FocusMode /> : <ActiveCards />}
    </>
  );
}
