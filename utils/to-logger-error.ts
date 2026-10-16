export function toLogError(error: unknown): { message: string; cause?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      ...(error.cause instanceof Error && { cause: error.cause.message }),
    };
  }
  return { message: String(error) };
}