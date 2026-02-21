# Users Routes

## Overview

Routes in `backend/routes/users.py` are mounted at `/api/v1/users`.
User actions rely on authenticated context via `get_current_user` in endpoint dependencies.

## Endpoints

### 1) Get current user

- **Method**: `GET`
- **Path**: `/api/v1/users/`
- **Auth**: Required
- **Description**: Returns the currently authenticated user.

**Success response**: `200 OK` with `UserResponse`.

Example:

```json
{
  "user_id": "<user-id>",
  "full_name": "Jane Doe",
  "username": "jane"
}
```

---

### 2) Update current user

- **Method**: `PATCH`
- **Path**: `/api/v1/users/`
- **Auth**: Required
- **Description**: Partially updates the authenticated user.

**Request body** (`application/json`):

```json
{
  "full_name": "Jane D.",
  "username": "jane_d",
  "password": "new-secret"
}
```

All fields are optional:

- `full_name`
- `username`
- `password`

**Behavior**:

- If `password` is provided, it is hashed before storing.

**Success response**: `200 OK` with updated `UserResponse`.

---

### 3) Delete current user

- **Method**: `DELETE`
- **Path**: `/api/v1/users/`
- **Auth**: Required
- **Description**: Deletes the currently authenticated user.

**Success response**: `204 No Content`

## Notes

- Router-level dependency currently includes database session dependency (`Depends(get_db)`).
- Endpoint-level auth still controls current-user access.
