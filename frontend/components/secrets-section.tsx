"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createSecret, deleteSecret } from "@/lib/actions/secrets";
import type { Secret } from "@/lib/types";
import { Copy, Plus, Trash2 } from "lucide-react";

export function SecretsSection({ secrets }: { secrets: Secret[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    expires_at: "",
  });
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await createSecret(
        formData.expires_at || null,
        formData.description || null,
      );
      if (result.success) {
        setFormData({ description: "", expires_at: "" });
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Failed to create secret");
      }
    } catch {
      setError("An unexpected error occurred");
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Generate New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate New Secret</DialogTitle>
                <DialogDescription>
                  Create a new API secret with optional description and
                  expiration date
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Production API Key"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_at">Expiration Date (optional)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData({ ...formData, expires_at: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Generating..." : "Generate"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {secrets.length === 0 ? (
          <p className="text-muted-foreground">No secrets generated yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Secret Key</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {secrets.map((secret) => (
                <TableRow key={secret.secret_id}>
                  <TableCell className="font-mono text-sm">
                    {secret.secret_key}
                  </TableCell>
                  <TableCell>
                    {secret.description || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {secret.expires_at ? (
                      new Date(secret.expires_at).toLocaleDateString()
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopy(secret.secret_key, secret.secret_id)
                        }
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
