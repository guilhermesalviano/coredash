import { EXTERNAL_SERVICES } from "@/config/config";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import logger from "@/lib/logger";
import { ErrorResponse, LocationResponse, NominatimProps } from "@/types/services";
import { toLogError } from "@/utils/to-logger-error";

export async function fetchNominatimAPI({latitude, longitude}: NominatimProps): Promise<LocationResponse | ErrorResponse> {
  const url = `${EXTERNAL_SERVICES.nominatim}?format=jsonv2&lat=${latitude}&lon=${longitude}`;
  const response = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'CoreDash/1.0',
    }
  });

  if (!response.ok) {
    logger.error("Error fetching Nominatim API: ", response.status, toLogError(response.text().catch(() => "")));
    const errorMessage = `Nominatim request failed with status ${response.status}`;
    return { error: errorMessage };
  }

  const responseJson = await response.json();

  return responseJson;
}