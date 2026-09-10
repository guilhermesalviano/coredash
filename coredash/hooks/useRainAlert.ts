"use client";

import { useEffect } from "react";

// WMO weather codes that indicate rain / showers / thunderstorm
const RAIN_CODES = new Set([
  51, 53, 55,       // drizzle
  56, 57,           // freezing drizzle
  61, 63, 65,       // rain
  66, 67,           // freezing rain
  80, 81, 82,       // showers
  95, 96, 99,       // thunderstorm
]);

const STORAGE_KEY = "rain_alert_ts";
const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

function isQuietHours(): boolean {
  const h = new Date().getHours();
  return h >= 21 || h < 7;
}

function hasCooldown(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < COOLDOWN_MS;
  } catch {
    return false;
  }
}

function markPlayed(): void {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
}

export function useRainAlert() {
  useEffect(() => {
    if (isQuietHours()) return;
    if (hasCooldown()) return;

    let weatherCode: number | undefined;
    let userInteracted = false;
    let played = false;

    const tryPlay = () => {
      if (played || !userInteracted || weatherCode === undefined) return;
      if (!RAIN_CODES.has(weatherCode)) return;
      console.log("Rain alert: playing sound. code is: ", weatherCode);

      played = true;
      const audio = new Audio("/audios/olha-a-chuva.mp3");
      audio.volume = 0.7;
      audio.play()
        .then(() => markPlayed())
        .catch(() => {});
    };

    console.log("Checking for rain alert...");
    // Fetch weather code
    fetch("/api/weather")
      .then((r) => r.json())
      .then((json) => {
        weatherCode = json.data?.code;
        tryPlay();
      })
      .catch(() => {});

    // Wait for first user interaction to satisfy autoplay policy
    const onInteraction = () => {
      userInteracted = true;
      tryPlay();
    };

    window.addEventListener("click", onInteraction, { once: true });
    window.addEventListener("keydown", onInteraction, { once: true });
    window.addEventListener("touchstart", onInteraction, { once: true });

    return () => {
      window.removeEventListener("click", onInteraction);
      window.removeEventListener("keydown", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
    };
  }, []);
}
