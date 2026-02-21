import { getStatementData } from "@/lib/actions/statements";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

export default async function StatementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getStatementData(id);

  if (!result.success || !result.data) {
    redirect("/dashboard");
  }

  const statement = result.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statement Details</h1>
        <p className="text-muted-foreground">
          {new Date(statement.from_date).toLocaleDateString()} -{" "}
          {new Date(statement.to_date).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Opening Balance</CardTitle>
            <CardDescription>Balance at start of period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statement.currency} {statement.balance.opening.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Closing Balance</CardTitle>
            <CardDescription>Balance at end of period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statement.currency} {statement.balance.closing.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowDownIcon className="h-5 w-5 text-red-500" />
              <CardTitle>Debits</CardTitle>
            </div>
            <CardDescription>Money out</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-red-500">
                {statement.currency}{" "}
                {statement.transactions.debits.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Number of Transactions
              </p>
              <p className="text-lg font-semibold">
                {statement.transactions.debits.count}
              </p>
            </div>
            {statement.transactions.debits.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">
                  {statement.transactions.debits.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowUpIcon className="h-5 w-5 text-green-500" />
              <CardTitle>Credits</CardTitle>
            </div>
            <CardDescription>Money in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-green-500">
                {statement.currency}{" "}
                {statement.transactions.credits.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Number of Transactions
              </p>
              <p className="text-lg font-semibold">
                {statement.transactions.credits.count}
              </p>
            </div>
            {statement.transactions.credits.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">
                  {statement.transactions.credits.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {statement.observations && statement.observations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Observations</CardTitle>
            <CardDescription>Key insights from the statement</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {statement.observations.map((observation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>{observation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
