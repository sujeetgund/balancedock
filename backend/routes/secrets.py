from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from security import get_current_user
import models
from database import get_db
from schemas import SecretCreate
from uuid import uuid4


secrets_router = APIRouter(prefix="/secrets", tags=["secrets"])


@secrets_router.get("/")
def get_secrets(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    secrets = (
        db.query(models.Secret)
        .filter(models.Secret.user_id == current_user.user_id)
        .all()
    )
    return secrets


@secrets_router.post("/")
def create_secret(
    secret_data: SecretCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    secret_key = uuid4().hex

    new_secret = models.Secret(
        secret_id=uuid4(),
        user_id=current_user.user_id,
        secret_key=secret_key,
        expires_at=secret_data.expires_at,
        description=secret_data.description,
    )
    db.add(new_secret)
    db.commit()
    db.refresh(new_secret)
    return new_secret


@secrets_router.delete("/{secret_id}")
def delete_secret(
    secret_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    secret = (
        db.query(models.Secret)
        .filter(
            models.Secret.secret_id == secret_id,
            models.Secret.user_id == current_user.user_id,
        )
        .first()
    )
    if not secret:
        raise HTTPException(status_code=404, detail="Secret not found")

    db.delete(secret)
    db.commit()
    return {"detail": "Secret deleted successfully"}
