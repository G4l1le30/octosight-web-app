"""
config.py — Centralized Pydantic Settings.

Single source of truth for all environment variables with type validation.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    database_url: str = "mysql+pymysql://octouser:octopassword@db:3306/octosight_db"
    mysql_ssl_ca: Optional[str] = None
    mysql_ssl_cert: Optional[str] = None
    mysql_ssl_key: Optional[str] = None
    db_pool_size: int = 10
    db_max_overflow: int = 20

    # JWT
    secret_key: str = "octosight-secret-key-change-in-production-2024"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # CORS
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # File storage
    upload_dir: str = "uploads"
    whitelist_path: str = "data/whitelist.txt"

    # Environment
    environment: str = "development"
    api_public_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"

    # Mail
    mail_username: Optional[str] = None
    mail_password: Optional[str] = None
    mail_from: str = "noreply@octosight.local"
    mail_from_name: str = "OctoSight"
    mail_server: str = "smtp.gmail.com"
    mail_port: int = 587

    # Google OAuth
    google_client_id: Optional[str] = None

    # Supabase
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None

    # ML
    ml_model_path: str = "models/spam_pipeline.pkl"
    ml_vectorizer_path: str = "models/vectorizer.pkl"

    # Default admin
    default_admin_email: Optional[str] = None
    default_admin_password: Optional[str] = None

    # Redis
    redis_url: str = ""

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
