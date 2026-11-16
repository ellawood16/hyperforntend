import { siteConfig } from "@/config/site";
import { ApiError, type ApiErrorPayload } from "@/api/types";

const CSRF_HEADER_NAME = "X-CSRF-Token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Fired when a request fails auth even after a refresh attempt — AuthContext
 * subscribes to this to clear session state and redirect to login. Kept as a
 * plain callback (not a React import) so this module has no UI dependency. */
let onUnauthenticated: (() => void) | null = null;
export function setUnauthenticatedHandler(handler: () => void) {
  onUnauthenticated = handler;
}

let csrfPromise: Promise<string> | null = null;

function getCsrfToken(): Promise<string> {
  if (!csrfPromise) {
    csrfPromise = fetch(`${siteConfig.apiBase}/api/auth/web/csrf/`, {
      credentials: "include",
      cache: "no-store",
    }).then(async (res) => {
      if (!res.ok) throw await parseError(res);
      const data: { csrf_token: string } = await res.json();
      return data.csrf_token;
    }).catch((error: unknown) => {
      csrfPromise = null;
      throw error;
    }).finally(() => {
      csrfPromise = null;
    });
  }
  return csrfPromise;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = getCsrfToken().then((csrf) => fetch(`${siteConfig.apiBase}/api/auth/web/token/refresh/`, {
      method: "POST",
      credentials: "include",
      headers: { [CSRF_HEADER_NAME]: csrf },
    }))
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Skip the 401-refresh-retry cycle — used by the refresh call itself and
   * by login/register, where a 401 is a real credential failure, not an
   * expired session. */
  skipAuthRetry?: boolean;
};

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path, siteConfig.apiBase);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseError(res: Response): Promise<ApiError> {
  let payload: Partial<ApiErrorPayload> | null = null;
  try {
    payload = await res.json();
  } catch {
    // non-JSON error body (e.g. an upstream 502 HTML page) — fall through
  }

  const message = payload?.message ?? payload?.detail ?? `Request failed (${res.status}).`;
  const code = payload?.error_code ?? payload?.code ?? "error";
  const details = payload?.error_details?.details ?? {};
  return new ApiError(message, code, res.status, details, payload?.errors);
}

async function rawRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };

  const isMultipart = options.body instanceof FormData;
  if (options.body !== undefined && !isMultipart) headers["Content-Type"] = "application/json";
  if (!SAFE_METHODS.has(method)) {
    headers[CSRF_HEADER_NAME] = await getCsrfToken();
  }

  const res = await fetch(buildUrl(path, options.query), {
    method,
    credentials: "include",
    headers,
    body: isMultipart ? options.body as FormData : options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.ok && (path === "/api/auth/web/login/" ||
      path === "/api/auth/web/login/challenge/confirm/" ||
      path === "/api/auth/web/logout/")) {
    csrfPromise = null;
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) throw await parseError(res);

  return (await res.json()) as T;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !options.skipAuthRetry) {
      const refreshed = await refreshSession();
      if (refreshed) {
        try {
          return await rawRequest<T>(path, options);
        } catch (retryError) {
          if (retryError instanceof ApiError && retryError.status === 401) onUnauthenticated?.();
          throw retryError;
        }
      }
      onUnauthenticated?.();
    }
    throw err;
  }
}

export const http = {
  get: <T>(path: string, query?: RequestOptions["query"]) => request<T>(path, { method: "GET", query }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
