"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { uploadStatement } from "@/lib/actions/statements";
import { Upload } from "lucide-react";

export function UploadStatementDialog({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("statement_file", file);

      const result = await uploadStatement(
        accountId,
        formData,
        password || null,
      );

      if (result.success) {
        setFile(null);
        setPassword("");
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Failed to upload statement");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Statement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Bank Statement</DialogTitle>
          <DialogDescription>
            Select a PDF file of your bank statement. Use a password if the file
            is encrypted.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="statement_file">Statement File</Label>
            <Input
              id="statement_file"
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password (optional)</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password if PDF is encrypted"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setPassword("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
