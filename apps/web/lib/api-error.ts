export type ApiErrorInfo = {
  code?: string;
  status?: number;
  retryAfter?: number;
  retryAt?: string;
};

export class ApiError extends Error {
  code?: string;
  status?: number;
  retryAfter?: number;
  retryAt?: string;

  constructor(message: string, info: ApiErrorInfo = {}) {
    super(message);
    this.name = "ApiError";
    this.code = info.code;
    this.status = info.status;
    this.retryAfter = info.retryAfter;
    this.retryAt = info.retryAt;
  }
}

export function getRetryAfterSeconds(response: Response) {
  const header = response.headers.get("Retry-After");
  if (!header) {
    return undefined;
  }
  const seconds = Number(header);
  if (!Number.isNaN(seconds)) {
    return Math.max(0, Math.floor(seconds));
  }
  const parsedDate = Date.parse(header);
  if (!Number.isNaN(parsedDate)) {
    const diff = Math.ceil((parsedDate - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  }
  return undefined;
}
