export class StatsNzError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "StatsNzError";
  }
}

export class StatsNzParseError extends StatsNzError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "StatsNzParseError";
  }
}

export class StatsNzApiError extends StatsNzError {
  readonly status: number;
  readonly retryable: boolean;
  readonly url?: string;

  constructor(
    message: string,
    details: { status: number; retryable: boolean; url?: string },
  ) {
    super(message);
    this.name = "StatsNzApiError";
    this.status = details.status;
    this.retryable = details.retryable;
    if (details.url !== undefined) {
      this.url = details.url;
    }
  }
}
