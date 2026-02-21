"use server";

import { getToken } from "@/lib/actions/auth";
import { getAccounts } from "@/lib/actions/accounts";
import { getStatements } from "@/lib/actions/statements";
import type { User, DashboardStats } from "@/lib/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
const API_BASE_URL = `${BACKEND_URL}/api/v1`;

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
