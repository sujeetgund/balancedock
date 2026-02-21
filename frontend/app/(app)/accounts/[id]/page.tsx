import { getAccount } from "@/lib/actions/accounts";
import { getStatementsByAccount } from "@/lib/actions/statements";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UploadStatementDialog } from "@/components/upload-statement-dialog";
import Link from "next/link";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accountResult = await getAccount(id);
  const statementsResult = await getStatementsByAccount(id);

  if (!accountResult.success || !accountResult.data) {
    redirect("/accounts");
  }

  const account = accountResult.data;
  const statements = statementsResult.data || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {account.account_name}
          </h1>
          <p className="text-muted-foreground">
            {account.bank_name} • {account.account_number}
          </p>
        </div>
        <UploadStatementDialog accountId={id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statements</CardTitle>
          <CardDescription>
            All uploaded statements for this account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statements.length === 0 ? (
            <p className="text-muted-foreground">
              No statements uploaded yet. Upload your first statement to get
              started.
            </p>
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
                {statements.map((statement) => (
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
