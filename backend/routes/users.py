from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models
from database import get_db
from security import get_current_user, pwd_context
from schemas import UserResponse, UserUpdate


users_router = APIRouter(
    prefix="/users", tags=["users"], dependencies=[Depends(get_db)]
)


@users_router.get("/")
def get_user(current_user: models.User = Depends(get_current_user)):
    return UserResponse(
        user_id=current_user.user_id,
        username=current_user.username,
        full_name=current_user.full_name,
    )


@users_router.patch("/")
def update_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.username is not None:
        current_user.username = user_update.username
    if user_update.password is not None:
        current_user.hashed_password = pwd_context.hash(user_update.password)

    db.commit()
    db.refresh(current_user)
    return UserResponse(
        user_id=current_user.user_id,
        username=current_user.username,
        full_name=current_user.full_name,
    )


@users_router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    db.delete(current_user)
    db.commit()
    return
