export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
    public readonly reason?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

