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
import { createAccount, deleteAccount } from "@/lib/actions/accounts";
import type { BankAccount } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export function BankAccountsSection({ accounts }: { accounts: BankAccount[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    account_name: "",
    bank_name: "",
    account_number: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await createAccount(
        formData.account_name,
        formData.bank_name,
        formData.account_number,
      );

      if (result.success) {
        setFormData({ account_name: "", bank_name: "", account_number: "" });
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Failed to create account");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;

    setDeletingId(accountId);
    try {
      const result = await deleteAccount(accountId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to delete account");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Bank Accounts</CardTitle>
            <CardDescription>Manage your bank accounts</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Bank Account</DialogTitle>
                <DialogDescription>
                  Enter the details of your bank account
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="account_name">Account Name</Label>
                  <Input
                    id="account_name"
                    placeholder="e.g., Personal Savings"
                    value={formData.account_name}
                    onChange={(e) =>
                      setFormData({ ...formData, account_name: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    placeholder="e.g., Chase Bank"
                    value={formData.bank_name}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_name: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    placeholder="e.g., 1234567890"
                    value={formData.account_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        account_number: e.target.value,
                      })
                    }
                    required
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
                    {loading ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.account_id} className="relative">
              <CardHeader>
                <CardTitle className="text-lg">
                  {account.account_name}
                </CardTitle>
                <CardDescription className="font-medium text-foreground/75">
                  {account.bank_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-foreground">
                  {account.account_number}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link href={`/accounts/${account.account_id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(account.account_id)}
                    disabled={deletingId === account.account_id}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
