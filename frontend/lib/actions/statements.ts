"use server";

import { getToken } from "@/lib/actions/auth";
import type { Statement, StatementData } from "@/lib/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
const API_BASE_URL = `${BACKEND_URL}/api/v1`;

type ApiStatement = {
  statement_id: string;
  account_id: string;
  from_date: string;
  to_date: string;
  opening_balance: number;
  closing_balance: number;
  filepath: string;
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

function normalizeStatement(statement: ApiStatement): Statement {
  const fileName = statement.filepath.split("/").pop() || "statement.json";

  return {
    statement_id: statement.statement_id,
    account_id: statement.account_id,
    file_name: fileName,
    uploaded_at: statement.created_at,
    from_date: statement.from_date,
    to_date: statement.to_date,
    opening_balance: statement.opening_balance,
    closing_balance: statement.closing_balance,
    filepath: statement.filepath,
  };
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function formatDate(value: unknown): string {
  if (typeof value !== "string" || !value) {
    return "";
  }

  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear());
  return `${day}-${month}-${year}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeStatementData(payload: any): StatementData {
  if (payload && typeof payload === "object" && "balance" in payload) {
    const balance = payload.balance ?? {};
    const transactions = payload.transactions ?? {};
    const debits = transactions.debits ?? {};
    const credits = transactions.credits ?? {};

    return {
      from_date: formatDate(payload.from_date),
      to_date: formatDate(payload.to_date),
      balance: {
        opening: toNumber(balance.opening),
        closing: toNumber(balance.closing),
      },
      currency: payload.currency ?? "",
      transactions: {
        debits: {
          count: toNumber(debits.count),
          amount: toNumber(debits.amount),
          description: debits.description ?? "",
        },
        credits: {
          count: toNumber(credits.count),
          amount: toNumber(credits.amount),
          description: credits.description ?? "",
        },
      },
      observations: Array.isArray(payload.observations)
        ? payload.observations
        : [],
    };
  }

  const statement = payload as ApiStatement;
  return {
    from_date: formatDate(statement.from_date),
    to_date: formatDate(statement.to_date),
    balance: {
      opening: toNumber(statement.opening_balance),
      closing: toNumber(statement.closing_balance),
    },
    currency: "USD",
    transactions: {
      debits: {
        count: 0,
        amount: 0,
        description: "",
      },
      credits: {
        count: 0,
        amount: 0,
        description: "",
      },
    },
    observations: [],
  };
}


export async function getStatements(): Promise<{
  success: boolean;
  data?: Statement[];
  error?: string;
}> {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(`${API_BASE_URL}/statements/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        success: false,
        error: extractErrorMessage(error, "Failed to fetch statements"),
      };
    }

    const data = (await response.json()) as ApiStatement[];
    return { success: true, data: data.map(normalizeStatement) };
  } catch (error) {
    console.error("Get statements error:", error);
    return { success: false, error: "An error occurred" };
  }
}

export async function getStatementsByAccount(
  accountId: string,
): Promise<{ success: boolean; data?: Statement[]; error?: string }> {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const search = new URLSearchParams({ account_id: accountId });
    const response = await fetch(
      `${API_BASE_URL}/statements/?${search.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        success: false,
        error: extractErrorMessage(error, "Failed to fetch statements"),
      };
    }

    const data = (await response.json()) as ApiStatement[];
    return { success: true, data: data.map(normalizeStatement) };
  } catch (error) {
    console.error("Get statements by account error:", error);
    return { success: false, error: "An error occurred" };
  }
}

export async function getStatementData(
  statementId: string,
): Promise<{ success: boolean; data?: StatementData; error?: string }> {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(`${API_BASE_URL}/statements/${statementId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        success: false,
        error: extractErrorMessage(error, "Failed to fetch statement data"),
      };
    }

    const payload = await response.json();
    return { success: true, data: normalizeStatementData(payload) };
  } catch (error) {
    console.error("Get statement data error:", error);
    return { success: false, error: "An error occurred" };
  }
}

export async function uploadStatement(
  accountId: string,
  formData: FormData,
  password?: string | null,
) {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const statementFile =
      formData.get("statement_file") ?? formData.get("file");
    if (!(statementFile instanceof File)) {
      return { success: false, error: "Statement file is required" };
    }

    const payload = new FormData();
    payload.append("account_id", accountId);
    payload.append("statement_file", statementFile);
    if (password) {
      payload.append("statement_password", password);
    }

    const response = await fetch(`${API_BASE_URL}/statements/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: payload,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        success: false,
        error: extractErrorMessage(error, "Failed to upload statement"),
      };
    }

    const data = (await response.json()) as ApiStatement;
    return { success: true, data: normalizeStatement(data) };
  } catch (error) {
    console.error("Upload statement error:", error);
    return { success: false, error: "An error occurred" };
  }
}

export async function deleteStatement(statementId: string) {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(`${API_BASE_URL}/statements/${statementId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        success: false,
        error: extractErrorMessage(error, "Failed to delete statement"),
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete statement error:", error);
    return { success: false, error: "An error occurred" };
  }
}
