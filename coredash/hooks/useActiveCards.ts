"use client";

import { useCallback, useEffect, useState } from "react";
// import storage from "@/lib/storage";

export const CARD_REGISTRY = [
  { id: "weather",   label: "Weather",          emoji: "🌤" },
  { id: "narrative", label: "Rocky (AI)",       emoji: "✨" },
  { id: "calendar",  label: "Calendar",         emoji: "📅" },
  { id: "gmail",     label: "Gmail",            emoji: "📧" },
  { id: "spotify",   label: "Spotify",          emoji: "🎵" },
  { id: "stocks",    label: "Stocks",           emoji: "📈" },
  { id: "todo",      label: "To-Do",            emoji: "✅" },
  { id: "news",      label: "News",             emoji: "📰" },
] as const;

export type CardId = (typeof CARD_REGISTRY)[number]["id"];

const STORAGE_KEY = "active_cards";
const SYNC_EVENT = "active-cards-changed";

const DEFAULT_ACTIVE: CardId[] = [
  "weather", "narrative", "calendar", "gmail", "spotify", "todo",
];

function load(): CardId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ACTIVE;
    const parsed = JSON.parse(raw) as CardId[];
    const valid = CARD_REGISTRY.map((c) => c.id);
    return parsed.filter((id) => valid.includes(id));
  } catch {
    return DEFAULT_ACTIVE;
  }
}

export function useActiveCards() {
  const [active, setActive] = useState<CardId[]>(DEFAULT_ACTIVE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setActive(load());
    setMounted(true);

    const onSync = () => setActive(load());
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
  }, []);

  const toggle = useCallback((id: CardId) => {
    setActive((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      setTimeout(() => window.dispatchEvent(new Event(SYNC_EVENT)), 0);
      return next;
    });
  }, []);

  const isActive = useCallback((id: CardId) => active.includes(id), [active]);

  return { active, toggle, isActive, mounted };
}
