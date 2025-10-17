export class HttpError extends Error {
  public readonly statusCode: number;

  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export const isHttpError = (value: unknown): value is HttpError => {
  return value instanceof HttpError;
};
