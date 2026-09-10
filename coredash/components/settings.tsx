"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import storage from "@/lib/storage";
import { CARD_REGISTRY, CardId, useActiveCards } from "@/hooks/useActiveCards";
import { useFocusMode } from "@/hooks/useFocusMode";

// ─── Icons ────────────────────────────────────────────────────────────────────

function SettingsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
        background: checked ? "var(--accent, #5a6e0f)" : "var(--border)",
        position: "relative", flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <span style={{
        position: "absolute", top: 3,
        left: checked ? 19 : 3,
        width: 14, height: 14,
        borderRadius: "50%", background: "#fff",
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

// ─── Theme selector ───────────────────────────────────────────────────────────

type ThemeMode = "light" | "dark";

function ThemeSection() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = storage.get("theme") as ThemeMode | null;
    const initial = (stored === "light" || stored === "dark") ? stored : "dark";
    setMode(initial);
  }, []);

  const apply = (next: ThemeMode) => {
    setMode(next);
    document.documentElement.setAttribute("data-theme", next);
    storage.set("theme", next);
  };

  return (
    <div>
      <p style={sectionLabel}>Appearance</p>
      <div style={{ display: "flex", gap: 8 }}>
        {(["light", "dark"] as ThemeMode[]).map((t) => (
          <button key={t} onClick={() => apply(t)}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${mode === t ? "var(--accent, #5a6e0f)" : "var(--border)"}`,
              background: mode === t ? "color-mix(in srgb, var(--accent, #5a6e0f) 12%, transparent)" : "var(--surface2)",
              color: mode === t ? "var(--foreground)" : "var(--muted)",
              fontSize: 12, fontWeight: mode === t ? 600 : 400,
              transition: "all 0.15s",
            }}
          >
            {t === "light" ? "☀️ Light" : "🌙 Dark"}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)",
  textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10,
};

// ─── Modal ────────────────────────────────────────────────────────────────────

function SettingsModal({ onClose }: { onClose: () => void }) {
  const { isActive, toggle } = useActiveCards();
  const { enabled: focusEnabled, setEnabled: setFocusEnabled } = useFocusMode();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const overlay = (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, animation: "appear 0.15s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 16, width: "100%", maxWidth: 380,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SettingsIcon size={13} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>Settings</span>
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16, lineHeight: 1, padding: 2 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Theme */}
          <ThemeSection />

          <div>
            <p style={sectionLabel}>Focus</p>
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 12px", borderRadius: 8,
                background: focusEnabled ? "var(--surface2)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontSize: 16 }}>◉</span>
                <span style={{ fontSize: 13, color: focusEnabled ? "var(--foreground)" : "var(--muted)" }}>
                  Focus Mode
                </span>
              </div>
              <Toggle checked={focusEnabled} onChange={() => setFocusEnabled(!focusEnabled)} />
            </div>
          </div>

          {/* Cards */}
          <div>
            <p style={sectionLabel}>Dashboard cards</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {CARD_REGISTRY.map((card) => (
                <div key={card.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "9px 12px", borderRadius: 8,
                    background: isActive(card.id as CardId) ? "var(--surface2)" : "none",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ fontSize: 16 }}>{card.emoji}</span>
                    <span style={{ fontSize: 13, color: isActive(card.id as CardId) ? "var(--foreground)" : "var(--muted)" }}>
                      {card.label}
                    </span>
                  </div>
                  <Toggle checked={isActive(card.id as CardId)} onChange={() => toggle(card.id as CardId)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

// ─── Export: button that opens the modal ─────────────────────────────────────

export default function Settings() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={ref}
        onClick={() => setOpen(true)}
        aria-label="Open settings"
        className="icon-button"
      >
        <SettingsIcon />
      </button>

      {open && <SettingsModal onClose={() => setOpen(false)} />}
    </>
  );
}
