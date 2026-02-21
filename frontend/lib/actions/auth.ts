"use server";

import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const API_BASE_URL = `${BACKEND_URL}/api/v1`;
const ACCESS_TOKEN_COOKIE = "token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

type AuthTokenResponse = {
  access_token: string;
  token_type: string;
};

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "detail" in payload &&
    typeof (payload as { detail: unknown }).detail === "string"
  ) {
    return (payload as { detail: string }).detail;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message: unknown }).message === "string"
  ) {
    return (payload as { message: string }).message;
  }

  return fallback;
}

function parseRefreshTokenFromSetCookie(
  setCookieHeader: string | null,
): string | null {
  if (!setCookieHeader) {
    return null;
  }

  const match = setCookieHeader.match(/(?:^|,\s*)refresh_token=([^;]+)/i);
  return match?.[1] ?? null;
}

function isJwtExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return true;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    const parsed = JSON.parse(decoded) as { exp?: number };

    if (!parsed.exp) {
      return false;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return parsed.exp <= nowInSeconds;
  } catch {
    return true;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      Refresh_token: refreshToken,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as AuthTokenResponse;
  return data.access_token;
}

export async function login(username: string, password: string) {
  try {
    const form = new URLSearchParams();
    form.set("username", username);
    form.set("password", password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        success: false,
        error: extractErrorMessage(error, "Login failed"),
      };
    }

    const data = (await response.json()) as AuthTokenResponse;
    const cookieStore = await cookies();
    const refreshToken = parseRefreshTokenFromSetCookie(
      response.headers.get("set-cookie"),
    );

    cookieStore.set(ACCESS_TOKEN_COOKIE, data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15,
    });

    if (refreshToken) {
      cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return { success: true, data };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "An error occurred during login" };
  }
}

export async function register(
  full_name: string,
  username: string,
  password: string,
) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ full_name, username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        success: false,
        error: extractErrorMessage(error, "Registration failed"),
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "An error occurred during registration" };
  }
}

export async function logout() {
  const token = await getToken();

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    }
  }

  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  return { success: true };
}

export async function getToken() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return await refreshAccessToken();
  }

  if (!isJwtExpired(accessToken)) {
    return accessToken;
  }

  return await refreshAccessToken();
}
