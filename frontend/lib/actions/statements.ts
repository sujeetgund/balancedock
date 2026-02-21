"use server";

import { getToken } from "./auth";
import type { Statement, StatementData } from "../types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const IS_DEV = process.env.NODE_ENV === "development";
const TEST_TOKEN = "dev-mock-token-12345";

// Mock data for development
const MOCK_STATEMENTS: Statement[] = [
  {
    statement_id: "stmt-1",
    account_id: "acc-1",
    file_name: "january_statement.pdf",
    uploaded_at: "2025-02-01T10:00:00Z",
    from_date: "2025-01-01",
    to_date: "2025-01-31",
  },
  {
    statement_id: "stmt-2",
    account_id: "acc-1",
    file_name: "december_statement.pdf",
    uploaded_at: "2025-01-05T10:00:00Z",
    from_date: "2024-12-01",
    to_date: "2024-12-31",
  },
  {
    statement_id: "stmt-3",
    account_id: "acc-2",
    file_name: "savings_january.pdf",
    uploaded_at: "2025-02-01T11:00:00Z",
    from_date: "2025-01-01",
    to_date: "2025-01-31",
  },
];

const MOCK_STATEMENT_DATA: Record<string, StatementData> = {
  "stmt-1": {
    from_date: "2025-01-01",
    to_date: "2025-01-31",
    balance: {
      opening: 5000.0,
      closing: 4250.5,
    },
    currency: "USD",
    transactions: {
      debits: {
        count: 15,
        amount: 2500.0,
        description:
          "Various purchases including groceries, utilities, and entertainment",
      },
      credits: {
        count: 3,
        amount: 1750.5,
        description: "Salary deposit and refunds",
      },
    },
    observations: [
      "Regular monthly salary received",
      "Higher than usual spending on entertainment",
      "Utility bills paid on time",
    ],
  },
  "stmt-2": {
    from_date: "2024-12-01",
    to_date: "2024-12-31",
    balance: {
      opening: 4500.0,
      closing: 5000.0,
    },
    currency: "USD",
    transactions: {
      debits: {
        count: 20,
        amount: 3000.0,
        description: "Holiday shopping and regular expenses",
      },
      credits: {
        count: 4,
        amount: 3500.0,
        description: "Salary and holiday bonus",
      },
    },
    observations: [
      "Holiday bonus received",
      "Increased spending during holiday season",
      "All bills paid on schedule",
    ],
  },
  "stmt-3": {
    from_date: "2025-01-01",
    to_date: "2025-01-31",
    balance: {
      opening: 10000.0,
      closing: 10050.0,
    },
    currency: "USD",
    transactions: {
      debits: {
        count: 0,
        amount: 0,
        description: "No debits this period",
      },
      credits: {
        count: 1,
        amount: 50.0,
        description: "Monthly interest credit",
      },
    },
    observations: [
      "Stable savings balance",
      "Interest earned as expected",
      "No withdrawals this month",
    ],
  },
};

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

    // Development mode: Return mock statements for test token
    if (IS_DEV && token === TEST_TOKEN) {
      return { success: true, data: MOCK_STATEMENTS };
    }

    const response = await fetch(`${BACKEND_URL}/api/statements`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch statements" };
    }

    const data = await response.json();
    return { success: true, data };
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

    // Development mode: Return mock statements for test token
    if (IS_DEV && token === TEST_TOKEN) {
      const statements = MOCK_STATEMENTS.filter(
        (stmt) => stmt.account_id === accountId,
      );
      return { success: true, data: statements };
    }

    const response = await fetch(
      `${BACKEND_URL}/api/accounts/${accountId}/statements`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return { success: false, error: "Failed to fetch statements" };
    }

    const data = await response.json();
    return { success: true, data };
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

    // Development mode: Return mock statement data for test token
    if (IS_DEV && token === TEST_TOKEN) {
      const data = MOCK_STATEMENT_DATA[statementId];
      if (data) {
        return { success: true, data };
      }
      return { success: false, error: "Statement not found" };
    }

    const response = await fetch(
      `${BACKEND_URL}/api/statements/${statementId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return { success: false, error: "Failed to fetch statement data" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Get statement data error:", error);
    return { success: false, error: "An error occurred" };
  }
}

export async function uploadStatement(accountId: string, formData: FormData) {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(
      `${BACKEND_URL}/api/accounts/${accountId}/statements`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to upload statement",
      };
    }

    const data = await response.json();
    return { success: true, data };
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

    const response = await fetch(
      `${BACKEND_URL}/api/statements/${statementId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      return { success: false, error: "Failed to delete statement" };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete statement error:", error);
    return { success: false, error: "An error occurred" };
  }
}
