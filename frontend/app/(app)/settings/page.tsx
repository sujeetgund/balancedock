import { getCurrentUser } from "@/lib/actions/user";
import { getAccounts } from "@/lib/actions/accounts";
import { getSecrets } from "@/lib/actions/secrets";
import { redirect } from "next/navigation";
import { ProfileSection } from "@/components/profile-section";
import { BankAccountsSection } from "@/components/bank-accounts-section";
import { SecretsSection } from "@/components/secrets-section";

export default async function SettingsPage() {
  const userResult = await getCurrentUser();
  const accountsResult = await getAccounts();
  const secretsResult = await getSecrets();

  if (!userResult.success || !userResult.data) {
    redirect("/login");
  }

  const user = userResult.data;
  const accounts = accountsResult.data || [];
  const secrets = secretsResult.data || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, accounts, and API secrets
        </p>
      </div>

      <ProfileSection user={user} />
      <BankAccountsSection accounts={accounts} />
      <SecretsSection secrets={secrets} />
    </div>
  );
}
