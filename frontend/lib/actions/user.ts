"use server";

import { getToken } from "./auth";
import { getAccounts } from "./accounts";
import { getStatements } from "./statements";
import type { User, DashboardStats } from "../types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const API_BASE_URL = `${BACKEND_URL}/api/v1`;
const IS_DEV = process.env.NODE_ENV === "development";
const TEST_TOKEN = "dev-mock-token-12345";

type ApiUser = {
  user_id: string;
  full_name: string;
  username: string;
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

function normalizeUser(user: ApiUser): User {
  return {
    user_id: user.user_id,
    full_name: user.full_name,
    username: user.username,
  };
}

// Mock data for development
const MOCK_USER: User = {
  user_id: "test-user-id",
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

    const response = await fetch(`${API_BASE_URL}/users/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        success: false,
        error: extractErrorMessage(error, "Failed to fetch user"),
      };
    }

    const data = (await response.json()) as ApiUser;
    return { success: true, data: normalizeUser(data) };
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

    const body: { full_name: string; username: string; password?: string } = {
      full_name,
      username,
    };
    if (password) {
      body.password = password;
    }

    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        success: false,
        error: extractErrorMessage(error, "Update failed"),
      };
    }

    const data = (await response.json()) as ApiUser;
    return { success: true, data: normalizeUser(data) };
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
    const accountsResult = await getAccounts();
    const statementsResult = await getStatements();

    if (!accountsResult.success || !statementsResult.success) {
      return {
        success: false,
        error:
          accountsResult.error ||
          statementsResult.error ||
          "Failed to fetch stats",
      };
    }

    if (IS_DEV) {
      return { success: true, data: MOCK_STATS };
    }

    const data: DashboardStats = {
      total_accounts: accountsResult.data?.length ?? 0,
      total_statements: statementsResult.data?.length ?? 0,
      total_secrets: 0,
    };

    return { success: true, data };
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return { success: false, error: "An error occurred" };
  }
}
