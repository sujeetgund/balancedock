from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import models
from config import settings
from typing import Annotated
from database import get_db
from sqlalchemy.orm import Session


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def create_tokens(user_id: str):
    # access token -> short-lived
    access_expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    access_token = jwt.encode(
        {"sub": str(user_id), "exp": access_expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    # refresh token -> long-lived
    refresh_expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    refresh_token = jwt.encode(
        {"sub": str(user_id), "exp": refresh_expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    return access_token, refresh_token, refresh_expire


def create_access_token(user_id: str):
    access_expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    access_token = jwt.encode(
        {"sub": str(user_id), "exp": access_expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    return access_token


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> models.User:
    try:
        # decode the token to get the user id
        # if the token is invalid or expired, this will raise a JWTError
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    return user
