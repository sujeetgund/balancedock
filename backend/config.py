from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings."""

    # Application
    APP_NAME: str = "BalanceDock Server"
    APP_VERSION: str = "0.1.0"
    DEBUG_MODE: bool = False

    STATEMENT_STORAGE_PATH: str = "uploads/statements"

    # Database
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "password"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "dbname"

    # External APIs
    GROQ_API_KEY: str = "your-groq-api-key"

    # Security
    PRODUCTION_ENV: bool = False
    SECRET_KEY: str = "your-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    class Config:
        env_file = ".env"


settings = Settings()
