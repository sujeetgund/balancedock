# Secrets Routes

## Overview

Routes in `backend/routes/secrets.py` are defined with prefix `/secrets` and are expected to be available under `/api/v1/secrets`.
User access is scoped through authentication via `get_current_user`.

## Endpoints

### 1) Get secrets

- **Method**: `GET`
- **Path**: `/api/v1/secrets/`
- **Auth**: Required
- **Description**: Returns all secrets that belong to the authenticated user.

**Success response** (`200 OK`):

- `[]` when user has no secrets
- Otherwise a list of secret records

---

### 2) Create secret

- **Method**: `POST`
- **Path**: `/api/v1/secrets/`
- **Auth**: Required
- **Description**: Creates a new secret for the authenticated user. The `secret_key` is auto-generated and cannot be specified.

**Request body** (`application/json`):

```json
{
  "expires_at": "2026-03-01T00:00:00Z",
  "description": "Production key"
}
```

Fields:

- `expires_at` (optional, datetime)
- `description` (optional, string)

**Success response**: `200 OK` with created secret object, including auto-generated `secret_key`.

---

### 3) Delete secret

- **Method**: `DELETE`
- **Path**: `/api/v1/secrets/{secret_id}`
- **Auth**: Required
- **Description**: Deletes a secret if it exists and belongs to the authenticated user.

**Path params**:

- `secret_id` (UUID string)

**Success response** (`200 OK`):

```json
{
  "detail": "Secret deleted successfully"
}
```

**Error responses**:

- `404 Not Found` when secret does not exist or is not owned by current user.

## Notes

- Secret queries are scoped to the authenticated user.
- `expires_at` and `description` are optional in creation requests.
