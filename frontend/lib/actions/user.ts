"use server";

import { getToken } from "./auth";
import type { User, DashboardStats } from "../types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const IS_DEV = process.env.NODE_ENV === "development";
const TEST_TOKEN = "dev-mock-token-12345";

// Mock data for development
const MOCK_USER: User = {
  id: "test-user-id",
  full_name: "Test User",
  username: "testuser",
};

const MOCK_STATS: DashboardStats = {
  total_accounts: 2,
  total_statements: 3,
  total_secrets: 1,
};

export async function getCurrentUser(): Promise<{
  success: boolean;
  data?: User;
  error?: string;
}> {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    // Development mode: Return mock user for test token
    if (IS_DEV && token === TEST_TOKEN) {
      return { success: true, data: MOCK_USER };
    }

    const response = await fetch(`${BACKEND_URL}/api/user/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch user" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Get current user error:", error);
    return { success: false, error: "An error occurred" };
  }
}

export async function updateProfile(
  full_name: string,
  username: string,
  password?: string,
) {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const body: any = { full_name, username };
    if (password) {
      body.password = password;
    }

    const response = await fetch(`${BACKEND_URL}/api/user/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Update failed" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, error: "An error occurred" };
  }
}

export async function getDashboardStats(): Promise<{
  success: boolean;
  data?: DashboardStats;
  error?: string;
}> {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    // Development mode: Return mock stats for test token
    if (IS_DEV && token === TEST_TOKEN) {
      return { success: true, data: MOCK_STATS };
    }

    const response = await fetch(`${BACKEND_URL}/api/user/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch stats" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return { success: false, error: "An error occurred" };
  }
}
