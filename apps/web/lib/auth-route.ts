const AUTH_ONLY_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/complete-profile"
];

export function isAuthOnlyPath(pathname?: string | null) {
  if (!pathname) {
    return false;
  }
  return AUTH_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

