# Statements Routes

## Overview

Routes in `backend/routes/statements.py` are mounted at `/api/v1/statements`.
All endpoints require authentication (`Authorization: Bearer <access_token>`).

## Endpoints

### 1) Get statements

- **Method**: `GET`
- **Path**: `/api/v1/statements/`
- **Auth**: Required
- **Description**: Returns all statements for the authenticated user. Optionally filter by `account_id`.

**Query params**:

- `account_id` (optional, UUID string): Filter statements to a specific account. If provided, validates that the account belongs to the current user.

**Success response** (`200 OK`):

- `[]` when user has no statements (or no statements for the filtered account)
- Otherwise a list of statement objects

**Error responses**:

- `404 Not Found` when `account_id` is provided but does not belong to current user.

---

### 2) Get statement by ID

- **Method**: `GET`
- **Path**: `/api/v1/statements/{statement_id}`
- **Auth**: Required
- **Description**: Returns parsed statement JSON if it exists and belongs to the authenticated user.

**Path params**:

- `statement_id` (UUID string)

**Success response** (`200 OK`):

- Parsed statement JSON (see `StatementProcessingResult` in `statement_processing_service.py`)

**Error responses**:

- `404 Not Found` when statement does not exist or does not belong to current user.

---

### 3) Add statement

- **Method**: `POST`
- **Path**: `/api/v1/statements/`
- **Auth**: Required
- **Description**: Uploads a PDF statement, processes it, stores parsed output to JSON file, and creates a statement DB record.

**Request body** (`multipart/form-data`):

- `account_id` (required, text): UUID of the account to associate with the statement
- `statement_file` (required, file/PDF): The PDF statement file
- `statement_password` (optional, text): Password for encrypted/protected PDF files

**Flow**:

1. Validates the account belongs to current user.
2. Reads uploaded PDF bytes into memory.
3. Calls `StatementProcessingService.process_statement(...)` with optional password for decryption.
4. Saves parsed JSON to configured statement storage path.
5. Inserts statement metadata into database.

**Success response** (`200 OK`): Created statement object.

**Error responses**:

- `404 Not Found` when account is not found or does not belong to current user.
- `500 Internal Server Error` on processing/storage/database failures.

---

### 4) Delete statement

- **Method**: `DELETE`
- **Path**: `/api/v1/statements/{statement_id}`
- **Auth**: Required
- **Description**: Deletes the statement record and its associated JSON file from storage. User must own the account the statement belongs to.

**Path params**:

- `statement_id` (UUID string)

**Success response** (`200 OK`):

```json
{
  "detail": "Statement deleted successfully"
}
```

**Error responses**:

- `404 Not Found` when statement does not exist or user does not have permission to delete it.
- `500 Internal Server Error` on file deletion or database failures.

## Notes

- All statement queries are scoped to the authenticated user and their accounts.
- The `GET /` route serves dual purposes: all user statements (no filter) or filtered by account (with validation).
- Permission checks validate both statement existence and user ownership before delete/access.
- The route relies on app state initialization: `app.state.statement_service` must be available.
- Statement files are stored using `settings.STATEMENT_STORAGE_PATH`.
