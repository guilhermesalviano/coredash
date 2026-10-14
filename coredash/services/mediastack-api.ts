import { APIS, EXTERNAL_SERVICES, UPDATE_INTERVAL_MS } from "@/config/config";
import { NewsResponse } from "@/types/services";

export async function fetchMediastackAPI(apiKey = APIS.newsApiKey): Promise<NewsResponse> {
  const API_KEY = apiKey;

  const response = await fetch(`${EXTERNAL_SERVICES.mediastack}?access_key=${API_KEY}&countries=br,us&categories=business,technology,science,health&limit=5`, {
    next: { revalidate: UPDATE_INTERVAL_MS },
  });

  if (!response.ok) {
    throw new Error("Falha ao buscar dados da API externa 'Mediastack'");
  }

  const responseJson = await response.json();

  return responseJson;
}