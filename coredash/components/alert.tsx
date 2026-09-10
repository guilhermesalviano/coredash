"use client";

import { Bell, X } from "lucide-react";
import type { AlertNotification } from "@/features/alerts/types";

export type { ScheduledAlert as AlertType } from "@/features/alerts/types";

interface AlertProps {
  alert: AlertNotification;
  onClose: () => void;
  onEnableSound: () => void;
}

export default function Alert({ alert, onClose, onEnableSound }: AlertProps) {
  return (
    <div
      role="alert"
      className="pointer-events-auto flex items-center gap-3 rounded-lg border border-orange-400 bg-orange-500 p-4! text-white shadow-2xl"
    >
      <div className="rounded-full bg-orange-600 p-2" aria-hidden="true">
        <Bell size={18} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-bold leading-tight">{alert.title}</span>
        <span className="text-xs opacity-90">
          {String(alert.hour).padStart(2, "0")}:{String(alert.minute).padStart(2, "0")}
        </span>
        {alert.soundBlocked && (
          <button
            type="button"
            onClick={onEnableSound}
            className="self-start rounded bg-orange-700 px-2 py-1 text-xs font-semibold hover:bg-orange-800"
          >
            Enable sound
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label={`Dismiss alert: ${alert.title}`}
        onClick={onClose}
        className="rounded p-1 transition-colors hover:bg-orange-600"
      >
        <X size={16} />
      </button>
    </div>
  );
}
