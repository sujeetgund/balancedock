"use server";

import { getToken } from "./auth";
import type { Secret } from "../types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const IS_DEV = process.env.NODE_ENV === "development";
const TEST_TOKEN = "dev-mock-token-12345";

// Mock data for development
const MOCK_SECRETS: Secret[] = [
  {
    secret_id: "secret-1",
    token: "sk_test_1234567890abcdef",
    created_at: "2025-02-01T09:00:00Z",
  },
];

export async function getSecrets(): Promise<{
  success: boolean;
  data?: Secret[];
  error?: string;
}> {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    // Development mode: Return mock secrets for test token
    if (IS_DEV && token === TEST_TOKEN) {
      return { success: true, data: MOCK_SECRETS };
    }

    const response = await fetch(`${BACKEND_URL}/api/secrets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch secrets" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Get secrets error:", error);
    return { success: false, error: "An error occurred" };
  }
}

export async function createSecret() {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(`${BACKEND_URL}/api/secrets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Failed to create secret",
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Create secret error:", error);
    return { success: false, error: "An error occurred" };
  }
}

export async function deleteSecret(secretId: string) {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(`${BACKEND_URL}/api/secrets/${secretId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to delete secret" };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete secret error:", error);
    return { success: false, error: "An error occurred" };
  }
}
