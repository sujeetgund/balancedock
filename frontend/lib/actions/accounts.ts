"use server";

import { getToken } from "@/lib/actions/auth";
import type { BankAccount } from "@/lib/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
const API_BASE_URL = `${BACKEND_URL}/api/v1`;

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
