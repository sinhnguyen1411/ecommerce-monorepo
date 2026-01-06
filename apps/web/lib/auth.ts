const USER_TOKEN_KEY = "ttc_user_token";
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

export function clearUserToken() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(USER_TOKEN_KEY);
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
