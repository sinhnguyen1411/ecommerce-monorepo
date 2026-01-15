const USER_TOKEN_KEY = "ttc_user_token";
const REFRESH_TOKEN_KEY = "ttc_refresh_token";
const ADMIN_TOKEN_KEY = "ttc_admin_token";

export function getUserToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(USER_TOKEN_KEY) || "";
}

export function setUserToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  if (token) {
    window.localStorage.setItem(USER_TOKEN_KEY, token);
  }
}

export function getRefreshToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(REFRESH_TOKEN_KEY) || "";
}

export function setRefreshToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  if (token) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}

export function clearUserToken() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(USER_TOKEN_KEY);
}

export function clearRefreshToken() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearAuthTokens() {
  clearUserToken();
  clearRefreshToken();
}

export function setAuthTokens(accessToken: string, refreshToken?: string) {
  if (accessToken) {
    setUserToken(accessToken);
  }
  if (refreshToken) {
    setRefreshToken(refreshToken);
  }
}

export function getAdminToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

export function setAdminToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  if (token) {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
}

export function clearAdminToken() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}
