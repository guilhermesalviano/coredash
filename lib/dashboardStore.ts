import { fetchJson } from "@/lib/api-client";
import type { DashboardSlice, DashboardStore } from "@/features/dashboard/types";

const STALE_MS = 20 * 60 * 1000;
type DashboardKey = keyof DashboardStore;
type Listener = () => void;

const emptySlice = <T>(): DashboardSlice<T> => ({ data: null, status: "idle", lastFetchedAt: 0 });

let store: DashboardStore = {
  weather: emptySlice(),
  news: emptySlice(),
  stocks: emptySlice(),
};

const listeners = new Set<Listener>();

function setSlice<K extends DashboardKey>(key: K, patch: Partial<DashboardSlice<DashboardStore[K]["data"]>>) {
  store = { ...store, [key]: { ...store[key], ...patch } };
  listeners.forEach((listener) => listener());
}

async function fetchSlice<K extends DashboardKey>(key: K, endpoint: string) {
  setSlice(key, { status: "loading" });
  try {
    const data = await fetchJson<DashboardStore[K]["data"]>(endpoint);
    setSlice(key, { data, status: "success", lastFetchedAt: Date.now() });
  } catch {
    setSlice(key, { status: "error" });
  }
}

const fetchers: Record<DashboardKey, () => Promise<void>> = {
  weather: () => fetchSlice("weather", "/api/weather?limit=6"),
  news: () => fetchSlice("news", "/api/news"),
  stocks: () => fetchSlice("stocks", "/api/stocks"),
};

export async function fetchAll() {
  await Promise.all(Object.values(fetchers).map((fetcher) => fetcher()));
}

function handleVisibility() {
  if (document.visibilityState !== "visible") return;
  const stale = (Object.keys(fetchers) as DashboardKey[]).filter(
    (key) => Date.now() - store[key].lastFetchedAt > STALE_MS,
  );
  if (stale.length) void Promise.all(stale.map((key) => fetchers[key]()));
}

let subscriberCount = 0;

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  subscriberCount += 1;
  if (subscriberCount === 1) {
    void fetchAll();
    document.addEventListener("visibilitychange", handleVisibility);
  }

  return () => {
    listeners.delete(listener);
    subscriberCount -= 1;
    if (subscriberCount === 0) document.removeEventListener("visibilitychange", handleVisibility);
  };
}

export function getSnapshot(): DashboardStore {
  return store;
}
