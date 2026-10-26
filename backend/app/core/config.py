import secrets
from typing import Optional
from pydantic import computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Focus & Todo API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    
    # Security / JWT - Loaded strictly from .env or environment variables
    SECRET_KEY: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for mobile app convenience

    # Administrator Account Credentials & Policies
    ADMIN_EMAIL: Optional[str] = "[EMAIL_ADDRESS]"
    ADMIN_USERNAME: Optional[str] = "admin"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @model_validator(mode="after")
    def validate_secrets(self) -> "Settings":
        if not self.SECRET_KEY:
            if self.ENVIRONMENT.lower() == "production":
                raise ValueError(
                    "CRITICAL SECURITY ERROR: SECRET_KEY must be provided via .env or environment variables in production."
                )
            # In local development or isolated test environments without a .env, generate an ephemeral key
            self.SECRET_KEY = secrets.token_hex(32)
        return self
    
    # Database
    DATABASE_URL: str = "sqlite:///./focus.db"
    DATABASE_URL_POOLED: Optional[str] = None

    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # Prefer pooled connection if available for cloud/serverless scaling
        url = self.DATABASE_URL_POOLED or self.DATABASE_URL
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

