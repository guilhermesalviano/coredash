"use client";

import React, { useState } from "react";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/hooks/useDashboard";
import { useClock } from "@/components/useClock";
import { AINarrative } from "@/components/aiNarrative";
import { LightningFlash } from "@/components/lightningFlash";
import { RainCanvas } from "@/components/rain";
import { getAtmosphericOverlay, getDayNightBackground } from "@/components/backgrounds";
import DashboardButton from "@/components/backToDashboard";

// ─── Panel & Label ────────────────────────────────────────────────────────────

const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border border-white/[0.07] backdrop-blur-sm relative overflow-hidden ${className}`}
    style={{ background: "rgba(255,255,255,0.04)" }}
  >
    {children}
  </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[10px] font-semibold tracking-[0.12em] text-white/30 uppercase">{children}</span>
);

const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 85, 86, 95, 96, 99]);
const isRaining = (code: number) => RAIN_CODES.has(code);

export default function AiAnalysis() {
  const clock = useClock();
  const router = useRouter();
  const { weather } = useDashboard();
  const [isThundering] = useState(false);

  // Pass the weather code so daytime backgrounds react to conditions
  const weatherCode = weather.data?.code;
  const background = getDayNightBackground(clock.hour, weatherCode);
  const atmosphericOverlay = getAtmosphericOverlay(clock.hour, weatherCode);

  if (!weather.data || weather.status === "idle" || weather.status === "loading" || weather.status === "error") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: getDayNightBackground(clock.hour) }}
        onClick={() => router.refresh()}
      >
        <button
          className="text-white/30 text-sm hover:text-white/60 transition-colors"
        >
          ↺ reconnect
        </button>
      </div>
    );
  }

  const w = weather.data;
  const raining = isRaining(w.code);

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden flex flex-col"
      style={{
        background,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        transition: "background 2s ease",
      }}
    >
      {/* Atmospheric overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: atmosphericOverlay, transition: "background 2s ease" }}
      />

      {raining && <RainCanvas />}
      {isThundering && <LightningFlash />}

      <div className="relative h-screen z-10 flex justify-center items-center gap-10 p-6! max-sm:flex-col">

        {/* Clock */}
        <div className="flex flex-col justify-center gap-2 pl-2">
          <div
            className="font-light text-white leading-none"
            style={{ fontSize: "clamp(64px, 8vw, 96px)", letterSpacing: "-4px", fontFamily: "'DM Mono', monospace" }}
          >
            {clock.h}<span className="text-white/20">:</span>{clock.m}
          </div>
          <div className="text-white/40 text-base font-light tracking-wide">
            {clock.day} &nbsp;|&nbsp; {clock.month} {clock.date}
          </div>
        </div>

        {/* Weather panel */}
        <Panel className="p-6! flex flex-col gap-4! min-w-sm max-sm:min-w-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/40">
              <MapPin size={12} />
              <span className="text-xs">{w.city}, {w.state}</span>
            </div>
            <Label>Live weather</Label>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div
                className="text-6xl font-light text-white"
                style={{ letterSpacing: "-3px", fontFamily: "'DM Mono', monospace" }}
              >
                {w.temp}°
              </div>
              <div className="text-white/50 text-sm mt-1!">{w.condition}</div>
            </div>

            <div className="relative w-20 h-20 shrink-0">
              <div className="text-6xl">{w.icon}</div>
            </div>
          </div>

          <AINarrative weather={w} hour={clock.hour} />
        </Panel>
      </div>

      <DashboardButton />
    </div>
  );
}