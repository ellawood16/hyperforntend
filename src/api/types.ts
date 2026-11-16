/** Normalized error shape from core/api_exception_handler.py — stable across
 * every endpoint in the backend, Android relies on it and so do we. */
export type ApiErrorPayload = {
  success: false;
  message: string;
  error_code: string;
  code: string;
  detail?: string;
  error_details: {
    code: string;
    message: string;
    status: number;
    details: Record<string, unknown>;
  };
  errors?: unknown;
};

export class ApiError extends Error {
  code: string;
  status: number;
  details: Record<string, unknown>;
  fieldErrors?: unknown;

  constructor(message: string, code: string, status: number, details: Record<string, unknown> = {}, fieldErrors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.fieldErrors = fieldErrors;
  }
}

/** DRF PageNumberPagination shape (core/pagination.py HistoryPagination). */
export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
