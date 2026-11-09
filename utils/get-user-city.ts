import fs from "fs";
import path from "path";
import { fetchNominatimAPI } from "@/services/nominatim-api";
import { getRuntimeSettings } from "@/features/settings/server/runtime-settings";
import logger from "@/lib/logger";
import { isErrorResponse } from "./check-service-error";

const CONFIG_PATH = path.join(process.cwd(), ".location-cache");

interface LocationCache {
  state: string;
  city: string;
  latitude: string;
  longitude: string;
}

// Last location read from or written to disk, so the file is not re-read on every lookup.
let memoryCache: LocationCache | null = null;

function readCache(latitude: string, longitude: string): LocationCache | null {
  const matches = (cached: LocationCache) => cached.latitude === latitude && cached.longitude === longitude;
  if (memoryCache && matches(memoryCache)) return memoryCache;
  try {
    const cached = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) as LocationCache;
    if (!matches(cached)) return null;
    memoryCache = cached;
    return cached;
  } catch {
    return null;
  }
}

function writeCache(data: LocationCache): void {
  memoryCache = data;
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    logger.warn("Could not write location cache:", CONFIG_PATH);
  }
}

export default async function getUserCity(): Promise<LocationCache> {
  const { settings } = await getRuntimeSettings();
  if (settings.city.trim()) {
    return {
      state: "",
      city: settings.city.trim(),
      latitude: settings.latitude,
      longitude: settings.longitude,
    };
  }
  const cached = readCache(settings.latitude, settings.longitude);
  if (cached) {
    logger.info("return user location from cache.");
    return cached;
  };

  const res = await fetchNominatimAPI({
    latitude: settings.latitude,
    longitude: settings.longitude,
  });

  if (isErrorResponse(res)) {
    logger.error("Failed to fetch user location from Nominatim API:", res.error);
    return {
      state: "Unknown",
      city: "Unknown",
      latitude: settings.latitude,
      longitude: settings.longitude,
    };
  }

  const location: LocationCache = {
    state:        res.address.state,
    city:         res.address.city,
    latitude: settings.latitude,
    longitude: settings.longitude,
  };

  writeCache(location);
  return location;
}
