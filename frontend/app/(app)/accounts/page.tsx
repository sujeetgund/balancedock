import { getAccounts } from "@/lib/actions/accounts";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

export default async function AccountsPage() {
  const result = await getAccounts();

  if (!result.success) {
    redirect("/login");
  }

  const accounts = result.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Bank Accounts
        </h1>
        <p className="text-muted-foreground text-base">
          View and manage your bank accounts
        </p>
      </div>

      <div className="flex items-center justify-end">
        <Button asChild>
          <Link href="/settings">
            <Plus className="h-4 w-4" />
            Add Account
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Link
            key={account.account_id}
            href={`/accounts/${account.account_id}`}
          >
            <Card className="cursor-pointer hover:border-primary transition-colors h-full">
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
                <p className="mt-1 text-sm text-muted-foreground">
                  Created {new Date(account.created_at).toLocaleDateString()}
                </p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Open account
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {accounts.length === 0 && (
          <Card className="border-dashed md:col-span-2 lg:col-span-3">
            <CardContent className="flex min-h-35 flex-col items-center justify-center text-center">
              <Plus className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">No accounts yet</p>
              <p className="text-[0.95rem] text-muted-foreground">
                Add your first bank account to start uploading statements.
              </p>
              <Button asChild className="mt-4">
                <Link href="/settings">Add Account</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
