"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSecret, deleteSecret } from "@/lib/actions/secrets";
import type { Secret } from "@/lib/types";
import { Copy, Plus, Trash2 } from "lucide-react";

export function SecretsSection({ secrets }: { secrets: Secret[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const result = await createSecret();
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to create secret");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (secretId: string) => {
    if (!confirm("Are you sure you want to delete this secret?")) return;

    setDeletingId(secretId);
    try {
      const result = await deleteSecret(secretId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to delete secret");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async (token: string, secretId: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedId(secretId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert("Failed to copy to clipboard");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>API Secrets</CardTitle>
            <CardDescription>Manage your API secret tokens</CardDescription>
          </div>
          <Button onClick={handleCreate} disabled={loading} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Generate New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {secrets.length === 0 ? (
          <p className="text-muted-foreground">No secrets generated yet.</p>
        ) : (
          <div className="space-y-3">
            {secrets.map((secret) => (
              <div
                key={secret.secret_id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {secret.token}
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {new Date(secret.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(secret.token, secret.secret_id)}
                  >
                    {copiedId === secret.secret_id ? (
                      "Copied!"
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(secret.secret_id)}
                    disabled={deletingId === secret.secret_id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
