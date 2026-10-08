/** Base error for any NZ data source client in this package. */
export class NzSourceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'NzSourceError';
  }
}

/** Extra detail carried by an API error. */
export interface NzSourceApiErrorDetails extends ErrorOptions {
  /** HTTP status code, when the failure arrived as a response. */
  status?: number | undefined;
  /** Whether retrying the same request could succeed. */
  retryable?: boolean | undefined;
}

/** The remote API rejected the request (HTTP error or bad payload). */
export class NzSourceApiError extends NzSourceError {
  /** HTTP status code, when the failure arrived as a response. */
  readonly status: number | undefined;
  /** Whether retrying the same request could succeed. */
  readonly retryable: boolean;

  constructor(source: string, message: string, details: NzSourceApiErrorDetails = {}) {
    super(`${source}: ${message}`, details);
    this.name = 'NzSourceApiError';
    this.status = details.status;
    this.retryable = details.retryable ?? false;
  }
}

/** The remote payload did not match the expected shape. */
export class NzSourceParseError extends NzSourceError {
  constructor(
    public readonly source: string,
    message: string,
    options?: ErrorOptions
  ) {
    super(`${source}: ${message}`, options);
    this.name = 'NzSourceParseError';
  }
}
