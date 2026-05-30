"""
session.py — SQLAlchemy engine, session factory, and get_db dependency.

Uses app.config.Settings as single source of truth for connection params.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.db.base import Base

connect_args = {}
if settings.mysql_ssl_ca:
    ssl_config: dict[str, str] = {"ca": settings.mysql_ssl_ca}
    if settings.mysql_ssl_cert:
        ssl_config["cert"] = settings.mysql_ssl_cert
    if settings.mysql_ssl_key:
        ssl_config["key"] = settings.mysql_ssl_key
    connect_args["ssl"] = ssl_config

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_pre_ping=True,
    pool_recycle=3600,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Backward-compatible re-export
from app.db.base import Base as Base

def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
