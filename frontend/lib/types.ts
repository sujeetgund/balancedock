export interface User {
  id: string;
  full_name: string;
  username: string;
}

export interface BankAccount {
  account_id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  created_at: string;
}

export interface Statement {
  statement_id: string;
  account_id: string;
  file_name: string;
  uploaded_at: string;
  from_date: string;
  to_date: string;
}

export interface StatementData {
  from_date: string;
  to_date: string;
  balance: {
    opening: number;
    closing: number;
  };
  currency: string;
  transactions: {
    debits: {
      count: number;
      amount: number;
      description: string;
    };
    credits: {
      count: number;
      amount: number;
      description: string;
    };
  };
  observations: string[];
}

export interface Secret {
  secret_id: string;
  token: string;
  created_at: string;
}

export interface DashboardStats {
  total_accounts: number;
  total_statements: number;
  total_secrets: number;
}
