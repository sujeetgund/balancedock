from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    Request,
    status,
    Query,
    File,
    Form,
)
from fastapi.responses import JSONResponse
from typing import List, Optional
from statement_processing_service import StatementProcessingService
from database import get_db
from sqlalchemy.orm import Session
from config import settings
import models
from security import get_current_user
from uuid import uuid4
import logging
import json
import os

logger = logging.getLogger(__name__)


statements_router = APIRouter(
    prefix="/statements", tags=["Statements"], dependencies=[Depends(get_current_user)]
)


@statements_router.get("/")
def get_statements(
    account_id: Optional[str] = Query(None, description="Filter by account ID"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        # If account_id provided, fetch statements for that account
        if account_id:
            db_account = (
                db.query(models.Account)
                .filter(
                    models.Account.account_id == account_id,
                    models.Account.user_id == current_user.user_id,
                )
                .first()
            )
            if not db_account:
                raise HTTPException(status_code=404, detail="Account not found")

            db_statements = (
                db.query(models.Statement)
                .filter(models.Statement.account_id == account_id)
                .all()
            )
        else:
            # Fetch all accounts for the user, then all their statements
            db_accounts = (
                db.query(models.Account)
                .filter(models.Account.user_id == current_user.user_id)
                .all()
            )
            account_ids = [account.account_id for account in db_accounts]

            db_statements = (
                db.query(models.Statement)
                .filter(models.Statement.account_id.in_(account_ids))
                .all()
                if account_ids
                else []
            )

        return db_statements
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching statements: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@statements_router.get("/{statement_id}")
def get_statement(
    statement_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        # fetch the statement from the database
        db_statement = (
            db.query(models.Statement)
            .filter(models.Statement.statement_id == statement_id)
            .first()
        )
        if not db_statement:
            logger.error(f"Statement not found")
            raise HTTPException(status_code=404, detail="Statement not found")

        # check if the statement belongs to the current user
        db_account = (
            db.query(models.Account)
            .filter(
                models.Account.account_id == db_statement.account_id,
                models.Account.user_id == current_user.user_id,
            )
            .first()
        )
        if not db_account:
            logger.error("User does not have permission to access this statement")
            raise HTTPException(status_code=404, detail="Statement not found")

        # load the statement data from the JSON file and return it in the response
        json_statement = None
        with open(db_statement.filepath, "r") as f:
            json_statement = json.load(f)

        return JSONResponse(content=json_statement, status_code=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching statement: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


def get_statement_service(request: Request):
    statement_service = getattr(request.app.state, "statement_service", None)

    if statement_service is None:
        logger.error("Statement service is not initialized")
        raise HTTPException(status_code=500, detail="Statement service not available")

    return statement_service


@statements_router.post("/")
def add_statement(
    account_id: str = Form(...),
    statement_file: UploadFile = File(...),
    statement_password: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    statement_service: StatementProcessingService = Depends(get_statement_service),
):
    try:
        # check if the account belongs to the current user
        db_accounts = db.query(models.Account).filter(
            models.Account.user_id == current_user.user_id,
            models.Account.account_id == account_id,
        )
        if not db_accounts.first():
            raise HTTPException(status_code=404, detail="Account not found")

        statement_content = statement_file.file.read()
        statement_file.file.close()

        processed_data = statement_service.process_statement(
            statement_content, password=statement_password
        )

        # generate a unique statement ID and file path for storage
        statement_id = uuid4()
        filepath = f"{settings.STATEMENT_STORAGE_PATH}/{statement_id}.json"

        # save the processed data to a JSON file
        with open(filepath, "w") as f:
            json.dump(processed_data.dict(), f)

        # save the processed data to the database
        new_statement = models.Statement(
            statement_id=statement_id,
            account_id=account_id,
            from_date=processed_data.from_date,
            to_date=processed_data.to_date,
            opening_balance=processed_data.balance.opening,
            closing_balance=processed_data.balance.closing,
            filepath=filepath,
        )
        db.add(new_statement)
        db.commit()
        db.refresh(new_statement)

        return new_statement
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing statement: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@statements_router.delete("/{statement_id}")
def delete_statement(
    statement_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        # check if the statement exists in the database
        db_statement = (
            db.query(models.Statement)
            .filter(models.Statement.statement_id == statement_id)
            .first()
        )
        if not db_statement:
            logger.error(f"Statement not found for deletion")
            raise HTTPException(status_code=404, detail="Statement not found")

        # check if statement belongs to current user
        db_account = (
            db.query(models.Account)
            .filter(
                models.Account.account_id == db_statement.account_id,
                models.Account.user_id == current_user.user_id,
            )
            .first()
        )
        if not db_account:
            logger.error("User does not have permission to delete this statement")
            raise HTTPException(status_code=404, detail="Statement not found")

        # delete the statement file from storage
        if os.path.exists(db_statement.filepath):
            os.remove(db_statement.filepath)

        # delete the statement record from the database
        db.delete(db_statement)
        db.commit()

        return JSONResponse(
            content={"detail": "Statement deleted successfully"},
            status_code=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error deleting statement: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
