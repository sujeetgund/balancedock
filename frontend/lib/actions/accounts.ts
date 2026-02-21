"use server";

import { getToken } from "./auth";
import type { BankAccount } from "../types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const API_BASE_URL = `${BACKEND_URL}/api/v1`;
const IS_DEV = process.env.NODE_ENV === "development";
const TEST_TOKEN = "dev-mock-token-12345";

type AccountType = "salary" | "savings" | "credit";

type ApiBankAccount = {
  account_id: string;
  bank_name: string;
  account_number: string;
  account_type: AccountType;
  created_at: string;
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

function normalizeAccount(account: ApiBankAccount): BankAccount {
  return {
    account_id: account.account_id,
    account_name: account.bank_name,
    bank_name: account.bank_name,
    account_number: account.account_number,
    account_type: account.account_type,
    created_at: account.created_at,
  };
}

// Mock data for development
const MOCK_ACCOUNTS: BankAccount[] = [
  {
    account_id: "acc-1",
    account_name: "Main Checking",
    bank_name: "Chase Bank",
    account_number: "****1234",
    account_type: "salary",
    created_at: "2025-01-15T10:00:00Z",
  },
  {
    account_id: "acc-2",
    account_name: "Savings Account",
    bank_name: "Bank of America",
    account_number: "****5678",
    account_type: "savings",
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

    const response = await fetch(`${API_BASE_URL}/bank-accounts/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        success: false,
        error: extractErrorMessage(error, "Failed to fetch accounts"),
      };
    }

    const data = (await response.json()) as ApiBankAccount[];
    return { success: true, data: data.map(normalizeAccount) };
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

    const accountsResult = await getAccounts();
    if (!accountsResult.success || !accountsResult.data) {
      return {
        success: false,
        error: accountsResult.error || "Failed to fetch account",
      };
    }

    const account = accountsResult.data.find(
      (item) => item.account_id === accountId,
    );
    if (!account) {
      return { success: false, error: "Account not found" };
    }

    return { success: true, data: account };
  } catch (error) {
    console.error("Get account error:", error);
    return { success: false, error: "An error occurred" };
  }
}

export async function createAccount(
  account_name: string,
  bank_name: string,
  account_number: string,
  account_type: AccountType = "savings",
) {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(`${API_BASE_URL}/bank-accounts/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bank_name: bank_name || account_name,
        account_number,
        account_type,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        success: false,
        error: extractErrorMessage(error, "Failed to create account"),
      };
    }

    const data = (await response.json()) as ApiBankAccount;
    return { success: true, data: normalizeAccount(data) };
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

    const response = await fetch(`${API_BASE_URL}/bank-accounts/${accountId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        success: false,
        error: extractErrorMessage(error, "Failed to delete account"),
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete account error:", error);
    return { success: false, error: "An error occurred" };
  }
}
