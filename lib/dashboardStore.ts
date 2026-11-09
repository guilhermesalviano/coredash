import { ApiClientError, fetchJson } from "@/lib/api-client";
import type { DashboardSeed, DashboardSlice, DashboardStore } from "@/features/dashboard/types";
import { detectLocale, LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n";
import storage from "@/lib/storage";

const STALE_MS = 20 * 60 * 1000;
type DashboardKey = keyof DashboardStore;
type Listener = () => void;

const emptySlice = <T>(): DashboardSlice<T> => ({ data: null, status: "idle", lastFetchedAt: 0, error: null });

let newsLanguage: Locale = "pt-BR";
let newsLanguageResolved = false;

// Resolves the locale the same way LocaleProvider does, but before the first
// fetch, so the page does not request pt-BR news and then English news.
function resolveNewsLanguage() {
  if (newsLanguageResolved || typeof window === "undefined") return;
  newsLanguageResolved = true;
  newsLanguage = detectLocale(storage.get(LOCALE_STORAGE_KEY), navigator.language);
}

function failureCode(error: unknown): string {
  return error instanceof ApiClientError && error.status === 504 ? "timeout" : "failed";
}

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
    setSlice(key, { data, status: "success", lastFetchedAt: Date.now(), error: null });
  } catch (error: unknown) {
    setSlice(key, { status: "error", error: failureCode(error) });
  }
}

const fetchers: Record<DashboardKey, () => Promise<void>> = {
  weather: () => fetchSlice("weather", "/api/weather?limit=24"),
  news: () => fetchSlice("news", `/api/news?lang=${encodeURIComponent(newsLanguage)}`),
  stocks: () => fetchSlice("stocks", "/api/stocks"),
};

export function setNewsLanguage(language: string) {
  const next = detectLocale(language);
  newsLanguageResolved = true;
  if (next === newsLanguage) return;
  newsLanguage = next;
  freshSeeds.delete("news");
  if (subscriberCount > 0) void fetchers.news();
}

export function retrySlice(key: DashboardKey) {
  return fetchers[key]();
}

export async function fetchAll() {
  await Promise.all(Object.values(fetchers).map((fetcher) => fetcher()));
}

// Slices the server handed over as still fresh; the page-load fetch skips them.
const freshSeeds = new Set<DashboardKey>();
const SEED_GRACE_MS = 5000;
let seededAt = 0;

function seedSlice<K extends DashboardKey>(key: K, seed: DashboardSeed) {
  const entry = seed[key];
  if (!entry || store[key].status !== "idle") return;
  // The news seed is always pt-BR; drop it when the locale already changed.
  if (key === "news" && newsLanguage !== "pt-BR") return;
  setSlice(key, {
    data: entry.data as DashboardStore[K]["data"],
    status: "success",
    lastFetchedAt: entry.fetchedAt,
    error: null,
  });
  if (entry.fresh) {
    freshSeeds.add(key);
    seededAt = Date.now();
  }
}

/** Fills idle slices with data the server rendered into the page. */
export function hydrateDashboard(seed: DashboardSeed) {
  resolveNewsLanguage();
  (Object.keys(fetchers) as DashboardKey[]).forEach((key) => seedSlice(key, seed));
}

async function fetchInitial() {
  resolveNewsLanguage();
  // Only the subscription that follows hydration may rely on the seed.
  const seedIsCurrent = Date.now() - seededAt < SEED_GRACE_MS;
  const keys = (Object.keys(fetchers) as DashboardKey[]).filter(
    (key) => !(seedIsCurrent && freshSeeds.has(key)),
  );
  await Promise.all(keys.map((key) => fetchers[key]()));
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
    void fetchInitial();
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
