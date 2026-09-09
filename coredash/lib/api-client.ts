import type { ApiResponse, ApiErrorResponse } from "@/types/api";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response.json()) as ApiResponse<T> | ApiErrorResponse;

  if (!response.ok) {
    const message = "error" in body ? body.error : "Request failed";
    throw new ApiClientError(message, response.status);
  }

  return "data" in body ? body.data : (body as T);
}

