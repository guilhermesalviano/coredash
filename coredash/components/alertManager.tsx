"use client";

import { useEffect, useRef, useState } from "react";
import Alert from "@/components/alert";
import { ALERTS } from "@/constants/alerts";
import { AlertAudioQueue } from "@/features/alerts/audio-queue";
import { ALERT_DURATION_MS, getDueScheduledAlerts, localDateKey, shouldShowRainAlert } from "@/features/alerts/schedule";
import type { AlertNotification, ScheduledAlert } from "@/features/alerts/types";
import type { WeatherData } from "@/features/weather/types";
import { fetchJson } from "@/lib/api-client";

const SCHEDULE_STORAGE_KEY = "coredash_delivered_alerts";
const RAIN_STORAGE_KEY = "rain_alert_ts";

function readDelivered(): Set<string> {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(SCHEDULE_STORAGE_KEY) ?? "[]");
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function readRainTimestamp(): number | null {
  try {
    const value = localStorage.getItem(RAIN_STORAGE_KEY);
    return value === null ? null : Number(value);
  } catch {
    return null;
  }
}

export default function AlertManager() {
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const controls = useRef<{ dismiss: (id: string) => void; enableSound: (id: string) => void } | null>(null);

  useEffect(() => {
    const visible = new Map<string, AlertNotification>();
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    const delivered = readDelivered();
    let lastRainShown: number | null = null;
    let rainRequest: AbortController | null = null;
    let disposed = false;

    const publish = () => {
      if (!disposed) setAlerts([...visible.values()]);
    };
    const audio = new AlertAudioQueue((id, soundBlocked) => {
      const alert = visible.get(id);
      if (!alert || alert.soundBlocked === soundBlocked) return;
      visible.set(id, { ...alert, soundBlocked });
      publish();
    });

    const dismiss = (id: string) => {
      visible.delete(id);
      clearTimeout(timers.get(id));
      timers.delete(id);
      audio.remove(id);
      publish();
    };

    const show = (alert: ScheduledAlert) => {
      if (disposed || visible.has(alert.id)) return;
      visible.set(alert.id, { ...alert, soundBlocked: false });
      publish();
      timers.set(alert.id, setTimeout(() => dismiss(alert.id), ALERT_DURATION_MS));
      audio.enqueue(alert);
    };

    const checkSchedule = () => {
      if (document.visibilityState !== "visible") return;
      const now = new Date();
      const prefix = `${localDateKey(now)}:`;
      let changed = false;
      for (const id of delivered) {
        if (!id.startsWith(prefix)) {
          delivered.delete(id);
          changed = true;
        }
      }
      for (const alert of getDueScheduledAlerts(ALERTS, now, delivered)) {
        delivered.add(alert.id);
        changed = true;
        show(alert);
      }
      if (!changed) return;
      try {
        sessionStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify([...delivered]));
      } catch {
        // In-memory deduplication still works when storage is unavailable.
      }
    };

    const checkRain = async () => {
      if (rainRequest || document.visibilityState !== "visible") return;
      const request = new AbortController();
      rainRequest = request;
      try {
        const weather = await fetchJson<WeatherData>("/api/weather", { signal: request.signal });
        if (disposed || request.signal.aborted || document.visibilityState !== "visible") return;
        const now = new Date();
        const stored = readRainTimestamp();
        const lastShown = stored !== null && Number.isFinite(stored)
          ? Math.max(stored, lastRainShown ?? 0)
          : lastRainShown;
        if (!shouldShowRainAlert(weather.code, lastShown, now)) return;
        lastRainShown = now.getTime();
        show({
          id: `rain:${lastRainShown}`,
          title: "Rain alert",
          hour: now.getHours(),
          minute: now.getMinutes(),
          sound: "/audios/olha-a-chuva.mp3",
          volume: 0.7,
          repeat: 1,
        });
        try {
          localStorage.setItem(RAIN_STORAGE_KEY, String(lastRainShown));
        } catch {
          // Preserve the cooldown in memory even if local storage is disabled.
        }
      } catch {
        // Weather failures do not interrupt scheduled alerts; retry on return.
      } finally {
        if (rainRequest === request) rainRequest = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSchedule();
        void checkRain();
      } else {
        rainRequest?.abort();
        rainRequest = null;
      }
    };

    controls.current = { dismiss, enableSound: (id) => audio.enableSound(id) };
    const initialCheck = setTimeout(checkSchedule, 0);
    const interval = setInterval(checkSchedule, 1000);
    void checkRain();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      controls.current = null;
      clearTimeout(initialCheck);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      rainRequest?.abort();
      for (const timer of timers.values()) clearTimeout(timer);
      audio.dispose();
    };
  }, []);

  return (
    <section aria-label="Alerts" className="pointer-events-none fixed top-4 right-4 z-[100] flex max-h-[calc(100dvh-2rem)] w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 overflow-y-auto">
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          alert={alert}
          onClose={() => controls.current?.dismiss(alert.id)}
          onEnableSound={() => controls.current?.enableSound(alert.id)}
        />
      ))}
    </section>
  );
}
