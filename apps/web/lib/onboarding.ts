const DEFAULT_AUTHENTICATED_PATH = "/account";
const ACCOUNT_PATH = "/account";
const LOGIN_PATH = "/login";

export function normalizeNextPath(
  raw: string | null | undefined,
  fallback = DEFAULT_AUTHENTICATED_PATH
) {
  const value = raw?.trim();
  if (!value) {
    return fallback;
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return fallback;
  }
  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}

export function buildCompleteProfileHref(nextPath?: string | null, fallback?: string) {
  const target = normalizeNextPath(nextPath, fallback || DEFAULT_AUTHENTICATED_PATH);
  if (target === ACCOUNT_PATH) {
    return ACCOUNT_PATH;
  }
  const search = new URLSearchParams({ next: target });
  return `${ACCOUNT_PATH}?${search.toString()}`;
}

export function buildLoginHref(nextPath?: string | null, fallback?: string) {
  const target = normalizeNextPath(nextPath, fallback || DEFAULT_AUTHENTICATED_PATH);
  const search = new URLSearchParams({ next: target });
  return `${LOGIN_PATH}?${search.toString()}`;
}

export function resolveAuthenticatedPath(
  onboardingRequired: boolean,
  nextPath?: string | null,
  fallback?: string
) {
  const target = normalizeNextPath(nextPath, fallback || DEFAULT_AUTHENTICATED_PATH);
  return onboardingRequired ? buildCompleteProfileHref(target, target) : target;
}
