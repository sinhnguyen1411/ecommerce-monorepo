const AUTH_ONLY_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/complete-profile"
];

const ADMIN_PATHS = ["/admin"];
const STOREFRONT_TRACKING_EXCLUDE_PATHS = [
  ...AUTH_ONLY_PATHS,
  ...ADMIN_PATHS,
  "/account",
  "/checkout",
  "/cart"
];

export function isAuthOnlyPath(pathname?: string | null) {
  if (!pathname) {
    return false;
  }
  return AUTH_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function isAdminPath(pathname?: string | null) {
  if (!pathname) {
    return false;
  }
  return ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function shouldTrackStorefrontPath(pathname?: string | null) {
  if (!pathname) {
    return false;
  }
  return !STOREFRONT_TRACKING_EXCLUDE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
