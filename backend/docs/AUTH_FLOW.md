# Authentication Flow

## Overview

BalanceDock uses JWT (JSON Web Token) based authentication with two-token strategy:

- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), stored in httpOnly cookie, used to mint new access tokens

## Token Types

### Access Token

- **Lifespan**: 15 minutes (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- **Storage**: Response body (client stores in memory)
- **Usage**: Bearer token in `Authorization` header
- **Claims**: `sub` (user_id), `exp` (expiration time)

### Refresh Token

- **Lifespan**: 7 days (configurable via `REFRESH_TOKEN_EXPIRE_DAYS`)
- **Storage**: httpOnly cookie (secure, not accessible to JavaScript)
- **Database**: Persisted in `refresh_tokens` table for validation/revocation
- **Claims**: `sub` (user_id), `exp` (expiration time)

## Endpoints

### 1. Login: `POST /auth/login`

**Purpose**: Authenticate user, issue access and refresh tokens

**Request**:

```bash
POST /api/v1/auth/login HTTP/1.1
Content-Type: application/x-www-form-urlencoded

username=john_doe&password=secret123
```

**Response** (200 OK):

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Side Effects**:

- Validates username/password against hashed password in database
- Issues new refresh token, persists to `refresh_tokens` table
- Sets httpOnly cookie: `refresh_token=<token>`

**Error Codes**:

- `401`: Invalid credentials (user not found or password mismatch)
- `500`: Unexpected server error

---

### 2. Refresh: `POST /auth/refresh`

**Purpose**: Mint new access token using refresh token

**Request** (any of these):

```bash
# Via httpOnly cookie (automatic from browser)
POST /api/v1/auth/refresh HTTP/1.1

# Via custom header (HTTPie)
POST /api/v1/auth/refresh HTTP/1.1
Refresh_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Via lowercase header
POST /api/v1/auth/refresh HTTP/1.1
refresh_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Flow**:

1. Validates refresh token is present (cookie or header)
2. Checks token exists in database
3. Checks token is not revoked
4. Checks token is not expired (deletes if expired)
5. Issues new access token
6. Returns new access token to client

**Error Codes**:

- `401`: No token, invalid token, revoked token, or expired token
- `500`: Unexpected server error

---

### 3. Logout: `POST /auth/logout`

**Purpose**: Invalidate user's refresh tokens, clear cookie

**Request**:

```bash
POST /api/v1/auth/logout HTTP/1.1
Authorization: Bearer <access_token>
```

**Response** (200 OK):

```json
{
  "detail": "Logged out successfully"
}
```

**Side Effects**:

- Deletes all refresh tokens for the user from database
- Clears `refresh_token` cookie

**Error Codes**:

- `401`: Not authenticated (access token invalid or missing)
- `500`: Unexpected server error

---

### 4. Register: `POST /auth/register`

**Purpose**: Create new user account

**Request**:

```json
POST /api/v1/auth/register HTTP/1.1
Content-Type: application/json

{
  "full_name": "John Doe",
  "username": "john_doe",
  "password": "secret123"
}
```

**Response** (201 Created):

```json
{
  "message": "User John Doe registered successfully",
  "user_id": "740afe91-6c48-4305-952d-6a1d533fd7f1"
}
```

**Validation**:

- Username must be unique
- Password is hashed with bcrypt

**Error Codes**:

- `400`: Username already exists
- `500`: Unexpected server error

---

## Protected Endpoints

All endpoints that depend on `get_current_user` require a valid, non-expired access token:

```bash
GET /api/v1/bank-accounts HTTP/1.1
Authorization: Bearer <access_token>
```

**Token Validation**:

- JWT signature verified using `SECRET_KEY`
- Expiration checked
- User record must exist in database
- Returns 401 if any check fails

---

## Security Considerations

### Best Practices Used

✅ Refresh tokens stored in httpOnly cookies (safe from XSS)  
✅ Access tokens short-lived (15 min) to limit exposure  
✅ Refresh tokens long-lived but validatedbefore use  
✅ Passwords hashed with bcrypt (not plain text)  
✅ Token secrets never logged; only generic error messages shown  
✅ Revoked tokens deleted from database  
✅ Expired tokens cleaned up on refresh attempt

### Workflow

```
User Login
    ↓
[Check credentials] → Valid?
    ↓ Yes
[Hash refresh token, store in DB] → [Set httpOnly cookie]
    ↓
Return Access Token (in body)

User Makes Request
    ↓
[Send access token in Authorization header]
    ↓
[Validate JWT signature & expiration]
    ↓
[Return 401 if expired or deleted user]

Token Expired
    ↓
[Send refresh token in cookie/header]
    ↓
[Check revoked, expired, exists in DB]
    ↓
[Delete if expired]
    ↓
[Return new access token]

User Logout
    ↓
[Verify access token valid]
    ↓
[Delete all refresh tokens for user]
    ↓
[Clear cookie]
```

### Assumptions

- `SECRET_KEY` is kept confidential (env var, not in code)
- HTTPS is used in production to prevent token interception
- Client stores access token securely (memory, not localStorage)
- Refresh token cookie is sent automatically by browser (httpOnly prevents JavaScript access)

---

## Example: Complete Auth Cycle

### 1. Register

```bash
http POST localhost:8080/api/v1/auth/register \
  full_name="John Doe" \
  username="john_doe" \
  password="secret123"
```

### 2. Login

```bash
http POST localhost:8080/api/v1/auth/login \
  username="john_doe" \
  password="secret123"
```

Returns `access_token` and sets `refresh_token` cookie.

### 3. Use Access Token

```bash
http GET localhost:8080/api/v1/bank-accounts \
  Authorization:"Bearer <access_token>"
```

### 4. Access Token Expires (after 15 min)

Attempt API call → 401 Unauthorized

### 5. Refresh Token

```bash
http POST localhost:8080/api/v1/auth/refresh \
  Cookie:"refresh_token=<token>"
```

Returns new `access_token`.

### 6. Logout

```bash
http POST localhost:8080/api/v1/auth/logout \
  Authorization:"Bearer <access_token>"
```

Deletes refresh tokens and clears cookie.

---

## Configuration

Edit `.env` or `config.py`:

```python
# Token lifetimes
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Cryptography
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"

# Production mode (affects cookie security)
PRODUCTION_ENV = False  # Set to True in production (enables Secure flag)
```

---

## Troubleshooting

| Issue                     | Cause                               | Solution                               |
| ------------------------- | ----------------------------------- | -------------------------------------- |
| 401 on protected endpoint | Access token expired or invalid     | Use refresh endpoint to get new token  |
| Refresh returns 401       | Token doesn't exist/revoked/expired | User must login again                  |
| Cookie not set            | Not in browser context              | Use header-based flow for CLI/HTTPie   |
| User appears deleted      | User record removed                 | get_current_user validates user exists |
