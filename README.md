# BalanceDock

**Secure bank statement intelligence for AI agents and developers.**

BalanceDock is a full-stack platform that helps users upload bank statements, transform them into structured financial data with LLM-powered extraction, and expose that data through secure APIs for financial decision support.

---

## Why BalanceDock

Developers building financial copilots need a reliable bridge between raw statements (PDFs) and machine-readable insights. BalanceDock provides that bridge with:

- A **Next.js frontend** for account, statement, and secret management
- A **FastAPI backend** with JWT auth and user-scoped data access
- A **PostgreSQL database** for persistent metadata and identity records
- An **LLM statement processing pipeline** for extracting balances, transaction summaries, and observations

---

## Key Features

- **Secure authentication flow**
  - User registration/login
  - Short-lived access tokens + long-lived refresh tokens
  - Refresh token persistence and revocation support

- **Bank account management**
  - Create, list, update, and delete bank accounts
  - User-level ownership checks for all account operations

- **Statement ingestion + AI extraction**
  - Upload statement files (including password-protected PDFs)
  - Extract tabular content from PDFs
  - Use Groq-backed LLM processing to return structured financial summaries:
    - Statement period
    - Opening/closing balance
    - Debit/credit totals and counts
    - Currency and observations

- **Statement lifecycle controls**
  - List statements globally or by account
  - Retrieve parsed statement JSON
  - Delete statements and underlying stored files

- **Agent/API secret management**
  - Generate per-user secret keys
  - Optional description + expiry
  - Delete/revoke individual secrets

- **Developer-friendly frontend**
  - Built with Next.js App Router + Server Actions
  - Integrated token handling and backend API calls
  - Dashboard, settings, accounts, and statement views

---

## Architecture Overview

### High-level stack

- **Frontend:** Next.js (TypeScript, App Router)
- **Backend:** FastAPI + SQLAlchemy
- **Database:** PostgreSQL
- **AI extraction service:** LangChain + Groq model + PDF table extraction

### Upload-to-insight flow (file upload to AI query)

1. User authenticates in the frontend and obtains an access token.
2. Frontend uploads a statement via `multipart/form-data` to the backend.
3. Backend validates that the target bank account belongs to the authenticated user.
4. `StatementProcessingService`:
   - Opens the PDF (with optional password)
   - Extracts tables from pages
   - Converts tables to markdown
   - Sends prompt + table content to a Groq-hosted LLM with a strict JSON schema
5. Backend stores:
   - Structured summary metadata in PostgreSQL
   - Full parsed JSON in `uploads/statements/<statement_id>.json`
6. Frontend or external consumers fetch processed data from statement endpoints for dashboards, analysis, or agent workflows.

---

## API Documentation (FastAPI)

> Base URL: `http://localhost:8080/api/v1`

### Health

| Method | Endpoint  | Auth | Description          |
| ------ | --------- | ---- | -------------------- |
| GET    | `/health` | No   | Service health check |

### Auth

| Method | Endpoint         | Auth                        | Description                                   |
| ------ | ---------------- | --------------------------- | --------------------------------------------- |
| POST   | `/auth/register` | No                          | Register user                                 |
| POST   | `/auth/login`    | No                          | Login and issue access token + refresh cookie |
| POST   | `/auth/refresh`  | No (requires refresh token) | Refresh access token                          |
| POST   | `/auth/logout`   | Yes                         | Logout and invalidate refresh tokens          |

### Users

| Method | Endpoint  | Auth | Description                               |
| ------ | --------- | ---- | ----------------------------------------- |
| GET    | `/users/` | Yes  | Get current user profile                  |
| PATCH  | `/users/` | Yes  | Update profile (name, username, password) |
| DELETE | `/users/` | Yes  | Delete current user                       |

### Bank Accounts

| Method | Endpoint                      | Auth | Description                                   |
| ------ | ----------------------------- | ---- | --------------------------------------------- |
| GET    | `/bank-accounts/`             | Yes  | List user bank accounts                       |
| POST   | `/bank-accounts/`             | Yes  | Create bank account                           |
| PATCH  | `/bank-accounts/{account_id}` | Yes  | Update bank account                           |
| DELETE | `/bank-accounts/{account_id}` | Yes  | Delete bank account and associated statements |

### Statements

| Method | Endpoint                     | Auth | Description                                     |
| ------ | ---------------------------- | ---- | ----------------------------------------------- |
| GET    | `/statements/`               | Yes  | List all statements (or filter by `account_id`) |
| GET    | `/statements/{statement_id}` | Yes  | Fetch parsed statement JSON                     |
| POST   | `/statements/`               | Yes  | Upload and process statement file               |
| DELETE | `/statements/{statement_id}` | Yes  | Delete statement record and stored JSON         |

### Secrets

| Method | Endpoint               | Auth | Description       |
| ------ | ---------------------- | ---- | ----------------- |
| GET    | `/secrets/`            | Yes  | List user secrets |
| POST   | `/secrets/`            | Yes  | Create secret key |
| DELETE | `/secrets/{secret_id}` | Yes  | Delete secret key |

---

## Installation Guide

## 1) Clone repository

```bash
git clone <your-repo-url>
cd balancedock
```

## 2) Backend setup (FastAPI)

### Prerequisites

- Python 3.12+
- PostgreSQL running locally or remotely

### Steps

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:

```env
APP_NAME=BalanceDock Server
APP_VERSION=0.1.0
DEBUG_MODE=False

STATEMENT_STORAGE_PATH=uploads/statements

DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=balancedock

GROQ_API_KEY=your-groq-api-key

PRODUCTION_ENV=False
SECRET_KEY=replace-with-a-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

Ensure storage directory exists:

```bash
mkdir -p uploads/statements
```

Run backend server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

Open docs:

- Swagger UI: `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`

## 3) Frontend setup (Next.js)

### Prerequisites

- Node.js 18+
- `pnpm` (recommended)

### Steps

```bash
cd frontend
pnpm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

Run frontend dev server:

```bash
pnpm dev
```

Open: `http://localhost:3000`

---

## Security & Privacy

BalanceDock is designed for sensitive financial workflows and includes foundational protections in the current implementation:

- **Password hashing** using bcrypt (never stored as plain text)
- **JWT-based authentication** with separate access and refresh lifetimes
- **Refresh-token invalidation** on logout and expiry handling in persistence
- **HTTP-only refresh cookies** configured by environment for secure transport
- **Per-user authorization checks** on accounts, statements, and secrets
- **Scoped secret keys** tied to individual users and optional expiry windows

### Data handling

- Statement files are processed and persisted as structured JSON in server storage.
- Statement metadata (period, balances, file path, ownership) is saved in PostgreSQL.
- Access to statement data is enforced through authenticated, user-scoped API routes.

### Production hardening recommendations

- Set strong `SECRET_KEY` and rotate it through secure secret management.
- Run behind HTTPS and set `PRODUCTION_ENV=True`.
- Restrict CORS to trusted frontend domains.
- Encrypt storage volumes/backups for statement data.
- Add audit logging and rate limiting before public deployment.

---

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** FastAPI, SQLAlchemy, Pydantic
- **Database:** PostgreSQL
- **AI/Data Processing:** LangChain, Groq, pdfplumber

---

## Who this is for

- Developers building **financial AI agents** that need secure statement ingestion and normalized outputs
- Individuals or teams who want to **connect LLMs to personal financial data** through a controllable API layer

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

## Author

<table style="border: none;">
  <tr>
    <td align="center">
      <a href="https://github.com/SujeetGund">
        <img src="https://github.com/SujeetGund.png" width="100px;" alt="Sujeet Gund"/>
        <br />
        <sub><b>Sujeet Gund</b></sub>
      </a>
    </td>
  </tr>
</table>
