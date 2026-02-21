from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import engine
import models
from config import settings
from routes.auth import auth_router
from routes.accounts import accounts_router
from routes.statements import statements_router
from routes.users import users_router
from routes.secrets import secrets_router
from statement_processing_service import StatementProcessingService
import logging

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

statement_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global statement_service
    try:
        logger.info("Starting the application and initializing resources.")
        # initialize the statement processing service
        statement_service = StatementProcessingService(api_key=settings.GROQ_API_KEY)
        app.state.statement_service = statement_service

        yield

        # clean up resources if needed
        app.state.statement_service = None
        del statement_service
        logger.info("Application shutdown complete.")
    except Exception as e:
        logger.error(f"An error occurred during application lifespan: {e}")
        raise e


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    root_path="/api/v1",
    lifespan=lifespan,
)
app.include_router(auth_router)
app.include_router(accounts_router)
app.include_router(statements_router)
app.include_router(users_router)
app.include_router(secrets_router)

models.Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
