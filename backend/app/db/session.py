"""
database.py — SQLAlchemy engine, session factory, and get_db dependency.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

MYSQL_USER = os.getenv("MYSQL_USER", "octouser")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "octopassword")
MYSQL_DB = os.getenv("MYSQL_DATABASE", "octosight_db")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")

# Optional MySQL SSL — set MYSQL_SSL_* env vars to enable
MYSQL_SSL_CA = os.getenv("MYSQL_SSL_CA", "")
MYSQL_SSL_CERT = os.getenv("MYSQL_SSL_CERT", "")
MYSQL_SSL_KEY = os.getenv("MYSQL_SSL_KEY", "")

connect_args = {}
if MYSQL_SSL_CA:
    ssl_config = {"ca": MYSQL_SSL_CA}
    if MYSQL_SSL_CERT:
        ssl_config["cert"] = MYSQL_SSL_CERT
    if MYSQL_SSL_KEY:
        ssl_config["key"] = MYSQL_SSL_KEY
    connect_args["ssl"] = ssl_config

SQLALCHEMY_DATABASE_URL = (
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
