import { getAccounts } from "@/lib/actions/accounts";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function AccountsPage() {
  const result = await getAccounts();

  if (!result.success) {
    redirect("/login");
  }

  const accounts = result.data || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
        <p className="text-muted-foreground">
          View and manage your bank accounts
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Link
            key={account.account_id}
            href={`/accounts/${account.account_id}`}
          >
            <Card className="cursor-pointer hover:border-primary transition-colors h-full">
              <CardHeader>
                <CardTitle>{account.account_name}</CardTitle>
                <CardDescription>{account.bank_name}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {account.account_number}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Created {new Date(account.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}

        <Link href="/settings">
          <Card className="cursor-pointer border-dashed hover:border-primary hover:bg-accent/50 transition-colors">
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[180px]">
              <Plus className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="font-medium">Add New Account</p>
              <p className="text-sm text-muted-foreground">Go to settings</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
