const USER_TOKEN_KEY = "ttc_user_token";
const REFRESH_TOKEN_KEY = "ttc_refresh_token";
const ADMIN_TOKEN_KEY = "ttc_admin_token";

export function getUserToken() {
  return "";
}

export function setUserToken(token: string) {
  void token;
}

export function getRefreshToken() {
  return "";
}

export function setRefreshToken(token: string) {
  void token;
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
  void accessToken;
  void refreshToken;
  clearAuthTokens();
}

export function getAdminToken() {
  return "";
}

export function setAdminToken(token: string) {
  void token;
}

export function clearAdminToken() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}
