"use server";

import { getToken } from "@/lib/actions/auth";
import type { Secret } from "@/lib/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
const API_BASE_URL = `${BACKEND_URL}/api/v1`;

type ApiSecret = {
  secret_id: string;
  user_id: string;
  secret_key: string;
  expires_at: string | null;
  description: string | null;
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

    const response = await fetch(`${API_BASE_URL}/secrets/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        success: false,
        error: extractErrorMessage(error, "Failed to fetch secrets"),
      };
    }

    const data = (await response.json()) as ApiSecret[];
    return { success: true, data };
  } catch (error) {
    console.error("Get secrets error:", error);
    return { success: false, error: "An error occurred" };
  }
}

export async function createSecret(
  expires_at?: string | null,
  description?: string | null,
) {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const body: { expires_at?: string | null; description?: string | null } =
      {};
    if (expires_at) {
      body.expires_at = expires_at;
    }
    if (description) {
      body.description = description;
    }

    const response = await fetch(`${API_BASE_URL}/secrets/`, {
      method: "POST",
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
        error: extractErrorMessage(error, "Failed to create secret"),
      };
    }

    const data = (await response.json()) as ApiSecret;
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

    const response = await fetch(`${API_BASE_URL}/secrets/${secretId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        success: false,
        error: extractErrorMessage(error, "Failed to delete secret"),
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete secret error:", error);
    return { success: false, error: "An error occurred" };
  }
}
