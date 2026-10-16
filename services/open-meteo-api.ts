import { EXTERNAL_SERVICES } from "@/config/config";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import logger from "@/lib/logger";
import { ErrorResponse, OpenMeteoProps, WeatherResponse } from "@/types/services";
import { toLogError } from "@/utils/to-logger-error";

export async function fetchOpenMeteoAPI({latitude, longitude, timezone = "UTC"}: OpenMeteoProps): Promise<WeatherResponse | ErrorResponse> {
  const url = `${EXTERNAL_SERVICES.openMeteo}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability&hourly=temperature_2m,weather_code,precipitation_probability,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=${timezone}`;

  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    logger.error("Error fetching Open Meteo API: ", response.status, toLogError(response.text().catch(() => "")));
    const errorMessage = `Open Meteo request failed with status ${response.status}`;
    return { error: errorMessage };
  }

  const responseJson = (await response.json()) as WeatherResponse;
  return responseJson;
}
