# BalanceDock Frontend

A modern Next.js frontend application for managing bank accounts and statements.

## Features

### Authentication

- **Login**: Secure user authentication with username and password
- **Register**: New user registration with full name, username, and password

### Dashboard

- Personalized greeting with user's full name
- Quick stats overview:
  - Total Bank Accounts
  - Total Statements
  - Total Secrets Generated
- Recent statements table with quick access to view details

### Bank Accounts Management

- View all bank accounts in a card-based layout
- Add new bank accounts with account name, bank name, and account number
- Delete existing accounts
- View individual account details with all associated statements
- Upload statements (PDF/images) to specific accounts

### Statements

- View all statements for each bank account
- Detailed statement analysis including:
  - Opening and closing balances
  - Debits (money out) with count and total amount
  - Credits (money in) with count and total amount
  - Transaction observations and insights
  - Period covered by the statement

### Settings

- **Profile Section**: Update full name, username, and password
- **Bank Accounts Section**: Manage all bank accounts
- **API Secrets Section**: Generate, copy, and delete API secret tokens

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Server Components + Client Components

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- pnpm (recommended) or npm

### Installation

1. Clone the repository and navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Create a `.env.local` file in the frontend directory:

   ```bash
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

4. Run the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/              # Authentication pages (login, register)
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx       # Auth layout (no sidebar)
│   ├── (app)/               # Protected app pages
│   │   ├── dashboard/       # Dashboard with stats and recent statements
│   │   ├── settings/        # User settings page
│   │   ├── accounts/        # Bank accounts listing and details
│   │   ├── statements/      # Statement details view
│   │   └── layout.tsx       # App layout (with sidebar)
│   ├── globals.css
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page (redirects based on auth)
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── sidebar.tsx          # App sidebar navigation
│   ├── profile-section.tsx  # Profile form component
│   ├── bank-accounts-section.tsx  # Bank accounts management
│   ├── secrets-section.tsx  # API secrets management
│   └── upload-statement-dialog.tsx  # Statement upload dialog
├── lib/
│   ├── actions/             # Server actions for API calls
│   │   ├── auth.ts          # Authentication actions
│   │   ├── user.ts          # User-related actions
│   │   ├── accounts.ts      # Bank account actions
│   │   ├── statements.ts    # Statement actions
│   │   └── secrets.ts       # API secret actions
│   ├── types.ts             # TypeScript type definitions
│   └── utils.ts             # Utility functions
└── public/                  # Static assets
```

## Server Actions

The frontend uses Next.js Server Actions to communicate with the backend API. All actions are located in `lib/actions/`:

- **auth.ts**: Login, register, logout, token management
- **user.ts**: Get current user, update profile, dashboard stats
- **accounts.ts**: CRUD operations for bank accounts
- **statements.ts**: Upload, retrieve, and manage statements
- **secrets.ts**: Generate, retrieve, and delete API secrets

## Environment Variables

| Variable                  | Description     | Default                 |
| ------------------------- | --------------- | ----------------------- |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | `http://localhost:8000` |

## API Integration

The frontend expects the backend to provide the following endpoints:

### Authentication

- `POST /api/auth/login` - Login with username and password
- `POST /api/auth/register` - Register new user

### User

- `GET /api/user/me` - Get current user details
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/stats` - Get dashboard statistics

### Bank Accounts

- `GET /api/accounts` - List all accounts
- `GET /api/accounts/:id` - Get account details
- `POST /api/accounts` - Create new account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/accounts/:id/statements` - Get statements for account
- `POST /api/accounts/:id/statements` - Upload statement

### Statements

- `GET /api/statements` - List all statements
- `GET /api/statements/:id` - Get statement details and parsed data
- `DELETE /api/statements/:id` - Delete statement

### API Secrets

- `GET /api/secrets` - List all secrets
- `POST /api/secrets` - Generate new secret
- `DELETE /api/secrets/:id` - Delete secret

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Server Components by default, Client Components only when needed
- Consistent use of async/await for server actions

## Building for Production

```bash
pnpm build
pnpm start
```

## License

MIT
