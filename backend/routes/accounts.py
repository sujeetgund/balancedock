from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from security import get_current_user
import models
from database import get_db
from sqlalchemy.orm import Session
from schemas import BankAccountCreate
from uuid import uuid4

accounts_router = APIRouter(
    prefix="/bank-accounts",
    tags=["bank-accounts"],
    dependencies=[Depends(get_current_user)],
)


@accounts_router.get("/")
def get_bank_accounts(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    # fetch all accounts for the current user
    db_accounts = (
        db.query(models.Account)
        .filter(models.Account.user_id == current_user.user_id)
        .all()
    )
    if not db_accounts:
        return []
    return db_accounts


@accounts_router.post("/", status_code=status.HTTP_201_CREATED)
def create_bank_account(
    account_data: BankAccountCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # check if account with same number already exists for the user
    existing_account = (
        db.query(models.Account)
        .filter(
            models.Account.user_id == current_user.user_id,
            models.Account.account_number == account_data.account_number,
        )
        .first()
    )
    if existing_account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account with this number already exists",
        )

    # create new account
    new_account = models.Account(
        account_id=uuid4(),
        user_id=current_user.user_id,
        bank_name=account_data.bank_name,
        account_number=account_data.account_number,
        account_type=models.AccountType(account_data.account_type),
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account


@accounts_router.patch("/{account_id}")
def update_bank_account(
    account_id: str,
    account_data: BankAccountCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # check if account exists and belongs to the current user before updating
    account = (
        db.query(models.Account).filter(models.Account.account_id == account_id).first()
    )
    if not account or account.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
        )

    # update account details
    account.bank_name = account_data.bank_name
    account.account_number = account_data.account_number
    account.account_type = models.AccountType(account_data.account_type)
    db.commit()
    db.refresh(account)
    return account


@accounts_router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bank_account(
    account_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # check if account exists and belongs to the current user before deleting
    account = (
        db.query(models.Account).filter(models.Account.account_id == account_id).first()
    )
    if not account or account.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
        )

    # delete all statements associated with the account
    db.query(models.Statement).filter(
        models.Statement.account_id == account_id
    ).delete()
    
    # delete the account itself
    db.delete(account)
    db.commit()

    return JSONResponse(
        status_code=status.HTTP_204_NO_CONTENT,
        content={"detail": "Account and associated statements deleted successfully"},
    )
