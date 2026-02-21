import { getCurrentUser, getDashboardStats } from "@/lib/actions/user";
import { getStatements } from "@/lib/actions/statements";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, FileText, Key } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const userResult = await getCurrentUser();
  const statsResult = await getDashboardStats();
  const statementsResult = await getStatements();

  if (!userResult.success || !userResult.data) {
    redirect("/login");
  }

  const user = userResult.data;
  const stats = statsResult.data || {
    total_accounts: 0,
    total_statements: 0,
    total_secrets: 0,
  };
  const recentStatements = statementsResult.data?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Hello, {user.full_name}
        </h1>
        <p className="text-muted-foreground text-base">
          Welcome to your dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[0.95rem] font-semibold">
              Total Bank Accounts
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_accounts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[0.95rem] font-semibold">
              Statements
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_statements}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[0.95rem] font-semibold">
              Secrets Generated
            </CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_secrets}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Statements</CardTitle>
        </CardHeader>
        <CardContent>
          {recentStatements.length === 0 ? (
            <p className="text-muted-foreground">No statements uploaded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Uploaded At</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentStatements.map((statement) => (
                  <TableRow key={statement.statement_id}>
                    <TableCell className="font-medium">
                      {statement.file_name}
                    </TableCell>
                    <TableCell>
                      {new Date(statement.from_date).toLocaleDateString()} -{" "}
                      {new Date(statement.to_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(statement.uploaded_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/statements/${statement.statement_id}`}
                        className="text-primary hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
