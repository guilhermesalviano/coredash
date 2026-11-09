"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Settings2 } from "lucide-react";
import { useLocale } from "@/contexts/localeContext";

// The modal (and the setup form inside it) is only downloaded when opened.
const SettingsModal = dynamic(() => import("@/components/settingsModal"), { ssr: false });

export default function Settings({ className = "icon-button" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={t("openSettings")} className={className}>
        <Settings2 size={18} strokeWidth={1.8} aria-hidden="true" />
      </button>
      {open && <SettingsModal onClose={() => setOpen(false)} />}
    </>
  );
}
