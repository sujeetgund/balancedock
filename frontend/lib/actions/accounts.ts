"use server";

import { getToken } from "./auth";
import type { BankAccount } from "../types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const IS_DEV = process.env.NODE_ENV === "development";
const TEST_TOKEN = "dev-mock-token-12345";

// Mock data for development
const MOCK_ACCOUNTS: BankAccount[] = [
  {
    account_id: "acc-1",
    account_name: "Main Checking",
    bank_name: "Chase Bank",
    account_number: "****1234",
    created_at: "2025-01-15T10:00:00Z",
  },
  {
    account_id: "acc-2",
    account_name: "Savings Account",
    bank_name: "Bank of America",
    account_number: "****5678",
    created_at: "2025-01-20T14:30:00Z",
  },
];

export async function getAccounts(): Promise<{
  success: boolean;
  data?: BankAccount[];
  error?: string;
}> {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    // Development mode: Return mock accounts for test token
    if (IS_DEV && token === TEST_TOKEN) {
      return { success: true, data: MOCK_ACCOUNTS };
    }

    const response = await fetch(`${BACKEND_URL}/api/accounts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch accounts" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Get accounts error:", error);
    return { success: false, error: "An error occurred" };
  }
}

export async function getAccount(
  accountId: string,
): Promise<{ success: boolean; data?: BankAccount; error?: string }> {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    // Development mode: Return mock account for test token
    if (IS_DEV && token === TEST_TOKEN) {
      const account = MOCK_ACCOUNTS.find((acc) => acc.account_id === accountId);
      if (account) {
        return { success: true, data: account };
      }
      return { success: false, error: "Account not found" };
    }

    const response = await fetch(`${BACKEND_URL}/api/accounts/${accountId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch account" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Get account error:", error);
    return { success: false, error: "An error occurred" };
  }
}

export async function createAccount(
  account_name: string,
  bank_name: string,
  account_number: string,
) {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(`${BACKEND_URL}/api/accounts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ account_name, bank_name, account_number }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to create account",
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Create account error:", error);
    return { success: false, error: "An error occurred" };
  }
}

export async function deleteAccount(accountId: string) {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(`${BACKEND_URL}/api/accounts/${accountId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to delete account" };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete account error:", error);
    return { success: false, error: "An error occurred" };
  }
}
