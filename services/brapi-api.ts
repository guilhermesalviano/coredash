import { APIS, EXTERNAL_SERVICES, UPDATE_INTERVAL_MS } from "@/config/config";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import logger from "@/lib/logger";
import { BrapiResponse, ErrorResponse } from "@/types/services";
import { toLogError } from "@/utils/to-logger-error";

export async function fetchBrapiAPI(stocks: string, token = APIS.brapiToken): Promise<BrapiResponse | ErrorResponse> {
  const url = `${EXTERNAL_SERVICES.brapi}/${stocks}?token=${token}`;

  const response = await fetchWithTimeout(url, {
    next: { revalidate: UPDATE_INTERVAL_MS },
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    const errorMessage = `BRAPI request failed with status ${response.status}`;
    logger.error("Error fetching BRAPI API:", errorMessage, toLogError(bodyText));
    return { error: errorMessage };
  }

  const responseJson = (await response.json()) as BrapiResponse;
  return responseJson;
}