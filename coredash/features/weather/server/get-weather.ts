import { ONE_MINUTE_IN_MS } from "@/constants";
import { LOCATION } from "@/config/config";
import { fetchOpenMeteoAPI } from "@/services/open-meteo-api";
import { getWeatherCondition, getWeatherIcon } from "@/utils/weather";
import { isErrorResponse } from "@/utils/check-service-error";
import getUserCity from "@/utils/get-user-city";
import { withRetry } from "@/utils/retry";
import { createMemoryCache } from "@/utils/in-memory-cache";
import { AppError } from "@/lib/api-error";
import type { WeatherData } from "@/features/weather/types";

const weatherCache = createMemoryCache<WeatherData>(ONE_MINUTE_IN_MS);

export async function getWeatherData(limit?: number): Promise<WeatherData> {
  const cacheKey = limit === undefined ? "default" : String(limit);
  const cached = weatherCache.get(cacheKey);
  if (cached) return cached;

  const weather = await withRetry(() => fetchOpenMeteoAPI({ latitude: LOCATION.latitude, longitude: LOCATION.longitude, limit: limit ?? 10 }));
  if (isErrorResponse(weather)) throw new AppError("Failed to retrieve weather data", 503, weather.error);

  const forecast = weather.hourly.time.map((timestamp, index) => ({
    timestamp,
    time: new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit" }) + "h",
    temp: Math.round(weather.hourly.temperature_2m[index]),
    condition: getWeatherCondition(weather.hourly.weather_code[index]),
    icon: getWeatherIcon(weather.hourly.weather_code[index], weather.hourly.is_day[index] === 1),
    code: weather.hourly.weather_code[index],
  })).slice(1);

  const location = await getUserCity();
  const city = location.city;
  const state = location.state;
  const data: WeatherData = {
    date: weather.current.time.split("T")[0], city, state,
    temp: Math.round(weather.current.temperature_2m),
    feels: Math.round(weather.current.apparent_temperature),
    condition: getWeatherCondition(weather.current.weather_code),
    icon: getWeatherIcon(weather.current.weather_code, weather.hourly.is_day[0] === 1),
    code: weather.current.weather_code, forecast,
  };
  weatherCache.set(cacheKey, data);
  return data;
}
