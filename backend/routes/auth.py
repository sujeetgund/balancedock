from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from uuid import uuid4
import logging

import models
from database import get_db
from config import settings
from security import pwd_context, create_tokens, create_access_token, get_current_user
from schemas import UserCreate


logger = logging.getLogger(__name__)

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    try:
        # check if user exists in database
        user = (
            db.query(models.User)
            .filter(models.User.username == form_data.username)
            .first()
        )

        # if user is not found or password is incorrect, raise an error
        if not user or not pwd_context.verify(form_data.password, user.hashed_password):
            logger.error("Invalid login attempt")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # create access and refresh tokens
        access_token, refresh_token, refresh_token_expiry_time = create_tokens(
            user.user_id
        )

        # save refresh token to database
        db.add(
            models.RefreshToken(
                token=refresh_token,
                user_id=user.user_id,
                expires_at=refresh_token_expiry_time,
            )
        )
        db.commit()

        # return access token in response body
        response = JSONResponse(
            content={
                "access_token": access_token,
                "token_type": "bearer",
            }
        )

        # set refresh token in httpOnly cookie
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            expires=refresh_token_expiry_time,
            samesite="none",
            secure=settings.PRODUCTION_ENV,
            path="/auth",
        )

        return response
    except HTTPException:
        raise
    except Exception:
        logger.error("Unexpected error during login process")
        raise HTTPException(status_code=401, detail="Invalid credentials")


@auth_router.post("/refresh")
def refresh_access_token(
    refresh_token: str | None = Cookie(default=None, alias="refresh_token"),
    header_refresh_token: str | None = Header(default=None, alias="Refresh_token"),
    header_refresh_token_lower: str | None = Header(
        default=None, alias="refresh_token"
    ),
    db: Session = Depends(get_db),
):
    # check if refresh token is provided in cookie or headers
    refresh_token = refresh_token or header_refresh_token or header_refresh_token_lower
    if not refresh_token:
        logger.error("No refresh token provided in cookie or headers")
        raise HTTPException(
            status_code=401,
            detail="No refresh token provided in cookie or headers",
        )
    try:
        # check if refresh token exists in database
        db_token = (
            db.query(models.RefreshToken)
            .filter(models.RefreshToken.token == refresh_token)
            .first()
        )

        # if refresh token is not found, raise an error
        if not db_token:

            raise HTTPException(
                status_code=401, detail="Invalid or expired refresh token"
            )

        # if refresh token is revoked for any reason, delete it & raise an error
        if db_token.revoked:

            db.query(models.RefreshToken).filter(
                models.RefreshToken.token == db_token.token
            ).delete()
            db.commit()

            raise HTTPException(
                status_code=401, detail="Invalid or expired refresh token"
            )

        # check if refresh token is expired
        # if expired, user must log in again
        token_expiry = db_token.expires_at
        if token_expiry is None:
            raise HTTPException(
                status_code=401, detail="Invalid or expired refresh token"
            )

        if token_expiry.tzinfo is None:
            token_expiry = token_expiry.replace(tzinfo=timezone.utc)

        if token_expiry < datetime.now(timezone.utc):
            logger.error("Refresh token has expired, deleting from database")

            # delete expired refresh token
            db.query(models.RefreshToken).filter(
                models.RefreshToken.user_id == db_token.user_id,
                models.RefreshToken.token == db_token.token,
            ).delete()
            db.commit()

            raise HTTPException(
                status_code=401, detail="Invalid or expired refresh token"
            )

        # create new access token
        new_access_token = create_access_token(db_token.user_id)

        # return new access token in response body
        return JSONResponse(
            content={
                "access_token": new_access_token,
                "token_type": "bearer",
            },
            status_code=status.HTTP_200_OK,
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error during token refresh")
        raise HTTPException(status_code=500, detail="Internal server error")


@auth_router.post("/logout")
def logout(
    current_user: models.User | None = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # if user is not authenticated, raise an error
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # delete refresh tokens for the user from the database to invalidate them
    db.query(models.RefreshToken).filter(
        models.RefreshToken.user_id == current_user.user_id
    ).delete()
    db.commit()

    # delete the refresh token cookie in the response
    response = JSONResponse({"detail": "Logged out successfully"})
    response.delete_cookie(
        key="refresh_token",
        path="/auth",
    )

    return response


@auth_router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        # check if username already exists in database
        existing_user = (
            db.query(models.User)
            .filter(models.User.username == user_data.username)
            .first()
        )
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already exists")

        # create new user and save to database
        new_user = models.User(
            user_id=uuid4(),
            full_name=user_data.full_name,
            username=user_data.username,
            hashed_password=pwd_context.hash(user_data.password),
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": f"User {user_data.full_name} registered successfully",
            "user_id": str(new_user.user_id),
        }

    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error during registration")
        raise HTTPException(status_code=500, detail="Internal server error")
