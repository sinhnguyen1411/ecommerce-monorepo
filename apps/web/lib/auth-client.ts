import {
  clearAuthTokens,
  getRefreshToken,
  getUserToken,
  setAuthTokens
} from "./auth";

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
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  const response = await fetch(buildUrl("/api/auth/refresh"), {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  const payload = (await response.json()) as ApiEnvelope<{
    access_token: string;
    refresh_token: string;
  }>;

  if (!response.ok || !payload.success) {
    clearAuthTokens();
    return false;
  }

  setAuthTokens(payload.data.access_token, payload.data.refresh_token);
  return true;
}

export async function authRequest<T>(
  path: string,
  options?: RequestInit,
  requestOptions?: RequestOptions
) {
  const auth = requestOptions?.auth ?? false;
  const retry = requestOptions?.retry ?? true;

  const token = auth ? getUserToken() : "";
  const response = await fetch(buildUrl(path), {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {})
    }
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
  throw new Error(message);
}
