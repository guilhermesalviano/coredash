import { EXTERNAL_SERVICES } from "@/config/config";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import logger from "@/lib/logger";
import { ErrorResponse, OpenMeteoProps, WeatherResponse } from "@/types/services";
import { toLogError } from "@/utils/to-logger-error";
import { addHours } from "date-fns";

function formatHourInTimezone(value: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:00`;
}

export async function fetchOpenMeteoAPI({latitude, longitude, limit = 10, timezone = "UTC"}: OpenMeteoProps): Promise<WeatherResponse | ErrorResponse> {
  const now = new Date();
  
  const start = formatHourInTimezone(now, timezone);
  const end = formatHourInTimezone(addHours(now, limit), timezone);

  const url = `${EXTERNAL_SERVICES.openMeteo}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&hourly=temperature_2m,weather_code,precipitation_probability,is_day&start_hour=${start}&end_hour=${end}&timezone=${timezone}`;

  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    logger.error("Error fetching Open Meteo API: ", response.status, toLogError(response.text().catch(() => "")));
    const errorMessage = `Open Meteo request failed with status ${response.status}`;
    return { error: errorMessage };
  }

  const responseJson = (await response.json()) as WeatherResponse;
  return responseJson;
}
