import { RETRY_CONFIG } from "@/constants";

export async function withRetry<T>(fn: () => Promise<T>, config = RETRY_CONFIG): Promise<T> {
  let lastError: unknown;
  let delay = config.delayMs;

  const stack = new Error().stack;
  const callerName = stack?.split("\n")[2]?.trim() || "unknown caller";

  for (let attempt = 1; attempt <= config.attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`[Retry] Origin: ${callerName} | Attempt ${attempt}/${config.attempts} failed:`, error);

      if (attempt < config.attempts) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= config.backoffMultiplier;
      }
    }
  }

  throw lastError;
}