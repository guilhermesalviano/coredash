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
  timeoutMs = 10000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const signal = init?.signal
      ? (typeof AbortSignal.any === "function"
          ? AbortSignal.any([init.signal, controller.signal])
          : init.signal)
      : controller.signal;

    const response = await fetch(input, { ...init, signal });
    const text = await response.text();

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      throw new ApiClientError(
        response.ok ? "Invalid JSON response" : text || response.statusText || "Request failed",
        response.status,
      );
    }

    if (!response.ok) {
      const message = body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : response.statusText || "Request failed";
      throw new ApiClientError(message, response.status);
    }

    if (body === null || typeof body !== "object") {
      throw new ApiClientError("Invalid API response", response.status);
    }

    return ("data" in body ? body.data : body) as T;
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    if (controller.signal.aborted) {
      throw new ApiClientError(`Request timed out after ${timeoutMs}ms`, 504);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
