import { fetchOpenMeteoAPI } from "@/services/open-meteo-api";
import { NextRequest, NextResponse } from "next/server";
import { ONE_MINUTE_IN_MS } from "@/constants";
import { formatResponse } from "@/lib/api-response";
import { getWeatherCondition, getWeatherIcon } from "@/utils/weather";
import { withRetry } from "@/utils/retry";
import { createMemoryCache } from "@/utils/in-memory-cache";
import { WeatherInternalAPIResponse } from "@/types/weather-api";
import getUserCity from "@/utils/get-user-city";
import { LOCATION } from "@/config/config";
import { isErrorResponse } from "@/utils/check-service-error";
import logger from "@/lib/logger";

const weatherCache = createMemoryCache<WeatherInternalAPIResponse>(ONE_MINUTE_IN_MS * 60 * 1);

export async function GET(req: NextRequest) {
  try {
    const limit = req.nextUrl.searchParams.get("limit");
    const cacheKey = limit ?? "default";

    const cached = weatherCache.get(cacheKey);
    if (cached) {
      logger.info("Weather data retrieved from cache successfully");
      return formatResponse(req, { message: "Weather data from cache successfully", data: cached });
    }

    const weather = await withRetry(() =>
      fetchOpenMeteoAPI({
        latitude: LOCATION.latitude,
        longitude: LOCATION.longitude,
        limit: limit ? Number(limit) : 10,
      })
    );

    if (isErrorResponse(weather)) return NextResponse.json({ error: "Failed to retrieve weather data",  reason: weather.error }, { status: 503 });

    const hours = weather.hourly.time
      .map((t: string, index: number) => ({
        timestamp: t,
        time: new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit" }) + "h",
        temp: Math.round(weather.hourly.temperature_2m[index]),
        condition: getWeatherCondition(weather.hourly.weather_code[index]),
        icon: getWeatherIcon(
          weather.hourly.weather_code[index],
          weather.hourly.is_day[index] === 1
        ),
      }))
      .slice(1, weather.hourly.time.length);

    const isDay = weather.hourly.is_day[0] === 1;

    const userLocation = await getUserCity();

    const weatherData = {
      date: weather.current.time.split("T")[0],
      city: userLocation.city,
      state: userLocation.state,
      temp: Math.round(weather.current.temperature_2m),
      feels: Math.round(weather.current.apparent_temperature),
      condition: getWeatherCondition(weather.current.weather_code),
      icon: getWeatherIcon(weather.current.weather_code, isDay),
      code: weather.current.weather_code,
      forecast: hours,
    };

    weatherCache.set(cacheKey, weatherData);

    return formatResponse(req, { message: "Weather data retrieved successfully", data: weatherData }, { status: 200 })
  } catch (error: unknown) {
    console.error("All retry attempts failed:", error);

    const isNetworkError =
      error instanceof TypeError && error.message.includes("fetch");

    return NextResponse.json(
      {
        error: "Failed to retrieve weather data",
        reason: isNetworkError ? "Network error" : "External API error",
      },
      { status: 503 }
    );
  }
}