# Bank Accounts Routes

## Overview

Routes in `backend/routes/accounts.py` are mounted at `/api/v1/bank-accounts`.
All endpoints require authentication (`Authorization: Bearer <access_token>`).

## Endpoints

### 1) Get bank accounts

- **Method**: `GET`
- **Path**: `/api/v1/bank-accounts/`
- **Auth**: Required
- **Description**: Returns all bank accounts that belong to the authenticated user.

**Success response** (`200 OK`):

- `[]` when user has no accounts
- Otherwise a list of account records

---

### 2) Create bank account

- **Method**: `POST`
- **Path**: `/api/v1/bank-accounts/`
- **Auth**: Required
- **Description**: Creates a new bank account for the authenticated user.

**Request body** (`application/json`):

```json
{
  "bank_name": "Acme Bank",
  "account_number": "1234567890",
  "account_type": "savings"
}
```

`account_type` allowed values:

- `salary`
- `savings`
- `credit`

**Success response**: `201 Created` with created account object.

**Error responses**:

- `400 Bad Request` when an account with the same `account_number` already exists for the same user.

---

### 3) Update bank account

- **Method**: `PATCH`
- **Path**: `/api/v1/bank-accounts/{account_id}`
- **Auth**: Required
- **Description**: Updates account details if the account exists and belongs to the authenticated user.

**Path params**:

- `account_id` (UUID string)

**Request body** (`application/json`):

```json
{
  "bank_name": "Acme Bank",
  "account_number": "1234567890",
  "account_type": "salary"
}
```

**Success response**: `200 OK` with updated account object.

**Error responses**:

- `404 Not Found` when account does not exist or is not owned by current user.

---

### 4) Delete bank account

- **Method**: `DELETE`
- **Path**: `/api/v1/bank-accounts/{account_id}`
- **Auth**: Required
- **Description**: Deletes the account and all associated statements.

**Path params**:

- `account_id` (UUID string)

**Success response**:

- Status: `204 No Content`
- Current implementation still sends a JSON body:

```json
{
  "detail": "Account and associated statements deleted successfully"
}
```

**Error responses**:

- `404 Not Found` when account does not exist or is not owned by current user.

## Notes

- All account queries are scoped to the authenticated user.
- Deleting an account removes related statements from the database first, then removes the account.
