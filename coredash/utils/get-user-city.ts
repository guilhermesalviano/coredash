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

function readCache(latitude: string, longitude: string): LocationCache | null {
  try {
    const cached = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) as LocationCache;
    return cached.latitude === latitude && cached.longitude === longitude ? cached : null;
  } catch {
    return null;
  }
}

function writeCache(data: LocationCache): void {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    logger.warn("Could not write location cache:", CONFIG_PATH);
  }
}

export default async function getUserCity(): Promise<LocationCache> {
  const { settings } = await getRuntimeSettings();
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
