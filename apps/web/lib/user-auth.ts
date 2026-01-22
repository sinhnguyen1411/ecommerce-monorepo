import { authRequest } from "./auth-client";

export type AuthUser = {
  id: number;
  email?: string;
  phone?: string;
  full_name?: string;
  avatar_url?: string;
  address?: string;
  birthdate?: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  emailVerificationStatus?: string;
  status: string;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

export function register(input: {
  email: string;
  name: string;
  dob: string;
  phone?: string;
  address: string;
  password: string;
  password_confirm: string;
}) {
  return authRequest<AuthTokens>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function login(input: { email: string; password: string }) {
  return authRequest<AuthTokens>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function sendEmailOTP() {
  return authRequest<{ sent: boolean; cooldown_seconds?: number; emailVerificationStatus?: string }>(
    "/api/auth/send-email-otp",
    {
      method: "POST",
      body: JSON.stringify({})
    },
    { auth: true }
  );
}

export function verifyEmailOTP(input: { otp: string }) {
  return authRequest<{ emailVerificationStatus: string }>(
    "/api/auth/verify-email-otp",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    { auth: true }
  );
}

export function logout() {
  return authRequest<{ revoked: boolean }>(
    "/api/auth/logout",
    {
      method: "POST",
      body: JSON.stringify({})
    },
    { auth: true }
  );
}

export function requestForgotPasswordOTP(input: { email: string }) {
  return authRequest<{ request_id: number; cooldown_seconds: number }>(
    "/api/auth/forgot-password/request-otp",
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export function verifyForgotPasswordOTP(input: {
  request_id: number;
  code: string;
}) {
  return authRequest<{ verification_token: string }>(
    "/api/auth/forgot-password/verify-otp",
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export function resetPassword(input: {
  verification_token: string;
  new_password: string;
}) {
  return authRequest<{ reset: boolean }>("/api/auth/forgot-password/reset", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
