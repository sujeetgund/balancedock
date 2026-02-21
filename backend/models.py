from database import Base
from sqlalchemy import (
    Column,
    DateTime,
    String,
    Uuid,
    Enum,
    ForeignKey,
    Float,
    Boolean,
    Integer,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum


class User(Base):
    __tablename__ = "users"

    user_id = Column(Uuid, primary_key=True, index=True)
    full_name = Column(String)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    refresh_tokens = relationship("RefreshToken", back_populates="user")
    accounts = relationship("Account", back_populates="user")
    secrets = relationship("Secret", back_populates="user")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)
    user_id = Column(Uuid, ForeignKey("users.user_id"))
    expires_at = Column(DateTime)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

    user = relationship("User", back_populates="refresh_tokens")


class AccountType(enum.Enum):
    SALARY = "salary"
    SAVINGS = "savings"
    CREDIT = "credit"


class Account(Base):
    __tablename__ = "accounts"

    account_id = Column(Uuid, primary_key=True, index=True)
    user_id = Column(Uuid, ForeignKey("users.user_id"))
    bank_name = Column(String)
    account_number = Column(String)
    account_type = Column(Enum(AccountType))
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="accounts")
    statements = relationship("Statement", back_populates="account")


class Statement(Base):
    __tablename__ = "statements"

    statement_id = Column(Uuid, primary_key=True, index=True)
    account_id = Column(Uuid, ForeignKey("accounts.account_id"))
    from_date = Column(DateTime)
    to_date = Column(DateTime)
    opening_balance = Column(Float)
    closing_balance = Column(Float)
    filepath = Column(String)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    account = relationship("Account", back_populates="statements")


class Secret(Base):
    __tablename__ = "secrets"

    secret_id = Column(Uuid, primary_key=True, index=True)
    user_id = Column(Uuid, ForeignKey("users.user_id"))
    secret_key = Column(String)
    expires_at = Column(DateTime)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="secrets")