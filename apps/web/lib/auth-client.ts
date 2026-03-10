import { clearAuthTokens } from "./auth";
import { ApiError, getRetryAfterSeconds } from "./api-error";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const trimmedBaseUrl = API_BASE_URL.replace(/\/$/, "");

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: {
    message: string;
    code: string;
  };
};

type RequestOptions = {
  auth?: boolean;
  retry?: boolean;
};

function buildUrl(path: string) {
  return `${trimmedBaseUrl}${path}`;
}

async function refreshAccessToken() {
  const response = await fetch(buildUrl("/api/auth/refresh"), {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const payload = (await response.json()) as ApiEnvelope<{
    access_token: string;
    refresh_token: string;
  }>;

  if (!response.ok || !payload.success) {
    clearAuthTokens();
    return false;
  }

  return true;
}

export async function authRequest<T>(
  path: string,
  options?: RequestInit,
  requestOptions?: RequestOptions,
) {
  const auth = requestOptions?.auth ?? false;
  const retry = requestOptions?.retry ?? true;

  const response = await fetch(buildUrl(path), {
    ...options,
    cache: "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (response.ok && payload.success) {
    return payload.data;
  }

  if (auth && response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return authRequest<T>(path, options, { auth, retry: false });
    }
  }

  const message = payload?.error?.message || "Request failed";
  throw new ApiError(message, {
    code: payload?.error?.code,
    status: response.status,
    retryAfter: getRetryAfterSeconds(response),
    retryAt: payload?.error?.retry_at,
  });
}
