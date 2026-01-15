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
  status: string;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

export function requestSignupOTP(input: {
  channel: "email" | "sms";
  email?: string;
  phone?: string;
}) {
  return authRequest<{ request_id: number; cooldown_seconds: number }>(
    "/api/auth/signup/request-otp",
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export function verifySignupOTP(input: { request_id: number; code: string }) {
  return authRequest<{ verification_token: string }>(
    "/api/auth/signup/verify-otp",
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export function completeSignup(input: {
  verification_token: string;
  password: string;
  full_name?: string;
  avatar_url?: string;
  address?: string;
}) {
  return authRequest<AuthTokens>("/api/auth/signup/complete", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function login(input: { identifier: string; password: string }) {
  return authRequest<AuthTokens>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function logout(refreshToken: string) {
  return authRequest<{ revoked: boolean }>(
    "/api/auth/logout",
    {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken })
    },
    { auth: true }
  );
}

export function requestForgotPasswordOTP(input: {
  channel: "email" | "sms";
  email?: string;
  phone?: string;
}) {
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
