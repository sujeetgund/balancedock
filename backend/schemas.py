from datetime import datetime
from pydantic import BaseModel
from typing import Literal
from uuid import UUID


class UserCreate(BaseModel):
    full_name: str
    username: str
    password: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    username: str | None = None
    password: str | None = None


class UserResponse(BaseModel):
    user_id: UUID
    full_name: str
    username: str


class BankAccountCreate(BaseModel):
    bank_name: str
    account_number: str
    account_type: Literal["salary", "savings", "credit"]


class SecretCreate(BaseModel):
    expires_at: datetime | None = None
    description: str | None = None
