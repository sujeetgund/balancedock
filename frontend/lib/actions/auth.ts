"use server";

import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const IS_DEV = process.env.NODE_ENV === "development";

// Test credentials for development only
const TEST_CREDENTIALS = {
  username: "testuser",
  password: "testpass",
  mockToken: "dev-mock-token-12345",
  mockUser: {
    id: "test-user-id",
    full_name: "Test User",
    username: "testuser",
  },
};

export async function login(username: string, password: string) {
  try {
    // Development mode: Check for test credentials first
    if (
      IS_DEV &&
      username === TEST_CREDENTIALS.username &&
      password === TEST_CREDENTIALS.password
    ) {
      const cookieStore = await cookies();

      // Store mock token in cookie
      cookieStore.set("token", TEST_CREDENTIALS.mockToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return {
        success: true,
        data: {
          token: TEST_CREDENTIALS.mockToken,
          user: TEST_CREDENTIALS.mockUser,
        },
      };
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Login failed" };
    }

    const data = await response.json();
    const cookieStore = await cookies();

    // Store token in cookie
    cookieStore.set("token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

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
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ full_name, username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Registration failed" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "An error occurred during registration" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  return { success: true };
}

export async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value;
}
