import { ONE_MINUTE_IN_MS } from "@/constants";
import { getRuntimeSettings } from "@/features/settings/server/runtime-settings";
import { fetchOpenMeteoAPI } from "@/services/open-meteo-api";
import { getWeatherCondition, getWeatherIcon } from "@/utils/weather";
import { isErrorResponse } from "@/utils/check-service-error";
import getUserCity from "@/utils/get-user-city";
import { withRetry } from "@/utils/retry";
import { createSwrCache, type SwrCacheEntry } from "@/utils/in-memory-cache";
import { AppError } from "@/lib/api-error";
import type { RuntimeSettingsResponse } from "@/features/settings/types";
import type { WeatherData } from "@/features/weather/types";

export const DEFAULT_WEATHER_HOURS = 24;

// Open-Meteo refreshes its models hourly at best; the stale window keeps the
// card instant while a refresh runs and covers short provider outages.
const weatherCache = createSwrCache<WeatherData>({
  ttlMs: ONE_MINUTE_IN_MS * 10,
  staleMs: ONE_MINUTE_IN_MS * 20,
});

function weatherCacheKey(limit: number, settings: RuntimeSettingsResponse): string {
  return [limit, settings.settings.latitude, settings.settings.longitude, settings.settings.timezone].join(":");
}

export async function getWeatherData(limit?: number): Promise<WeatherData> {
  const settings = await getRuntimeSettings();
  const effectiveLimit = limit ?? DEFAULT_WEATHER_HOURS;
  return weatherCache.get(weatherCacheKey(effectiveLimit, settings), () => loadWeatherData(effectiveLimit, settings));
}

/** Returns the cached weather without contacting the provider. */
export async function peekWeatherData(limit = DEFAULT_WEATHER_HOURS): Promise<SwrCacheEntry<WeatherData> | null> {
  return weatherCache.peek(weatherCacheKey(limit, await getRuntimeSettings()));
}

async function loadWeatherData(effectiveLimit: number, settings: RuntimeSettingsResponse): Promise<WeatherData> {
  const weather = await withRetry(() => fetchOpenMeteoAPI({
    latitude: settings.settings.latitude,
    longitude: settings.settings.longitude,
    timezone: settings.settings.timezone,
  }));
  if (isErrorResponse(weather)) throw new AppError("Failed to retrieve weather data", 503, weather.error);

  // Open-Meteo returns the whole forecast window from midnight; keep `effectiveLimit` hours starting at the current hour.
  const currentHour = `${weather.current.time.slice(0, 13)}:00`;
  const startIndex = Math.max(0, weather.hourly.time.findIndex((timestamp) => timestamp >= currentHour));
  const hourlyIndexes = weather.hourly.time.map((_, index) => index).slice(startIndex, startIndex + effectiveLimit);

  const forecast = hourlyIndexes.map((index) => ({
    timestamp: weather.hourly.time[index],
    time: new Date(weather.hourly.time[index]).toLocaleTimeString("pt-BR", { hour: "2-digit", timeZone: settings.settings.timezone }) + "h",
    temp: Math.round(weather.hourly.temperature_2m[index]),
    condition: getWeatherCondition(weather.hourly.weather_code[index]),
    icon: getWeatherIcon(weather.hourly.weather_code[index], weather.hourly.is_day[index] === 1),
    code: weather.hourly.weather_code[index],
    precipitationProb: Math.round(weather.hourly.precipitation_probability?.[index] ?? 0),
  }));

  const daily = weather.daily?.time.map((dateStr, index) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const weekday = utcDate
      .toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" })
      .replace(".", "")
      .toLowerCase();
    const code = weather.daily?.weather_code[index] ?? 0;
    return {
      date: dateStr,
      dayLabel: `${weekday} ${day}`,
      tempMax: Math.round(weather.daily?.temperature_2m_max[index] ?? 0),
      tempMin: Math.round(weather.daily?.temperature_2m_min[index] ?? 0),
      precipitationProb: Math.round(weather.daily?.precipitation_probability_max[index] ?? 0),
      code,
      icon: getWeatherIcon(code, true),
    };
  }) ?? [];

  const location = await getUserCity();
  const city = location.city;
  const state = location.state;
  const temps = forecast.map((f) => f.temp);
  const data: WeatherData = {
    date: weather.current.time.split("T")[0],
    city,
    state,
    temp: Math.round(weather.current.temperature_2m),
    feels: Math.round(weather.current.apparent_temperature),
    tempMax: daily[0]?.tempMax ?? (temps.length > 0 ? Math.max(...temps) : Math.round(weather.current.temperature_2m)),
    tempMin: daily[0]?.tempMin ?? (temps.length > 0 ? Math.min(...temps) : Math.round(weather.current.temperature_2m)),
    humidity: Math.round(weather.current.relative_humidity_2m ?? 0),
    windSpeed: Math.round(weather.current.wind_speed_10m ?? 0),
    precipitationProb: Math.round(
      weather.current.precipitation_probability ?? weather.hourly.precipitation_probability?.[startIndex] ?? 0,
    ),
    condition: getWeatherCondition(weather.current.weather_code),
    icon: getWeatherIcon(weather.current.weather_code, weather.hourly.is_day[startIndex] === 1),
    code: weather.current.weather_code,
    forecast,
    daily,
  };
  return data;
}
