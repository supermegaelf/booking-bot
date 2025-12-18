from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings
import logging

logger = logging.getLogger(__name__)

import sys

database_url = settings.database_url

if not database_url.endswith('/booking_db'):
    error_msg = f"ERROR: Database URL must end with /booking_db, but got: {database_url}"
    print(error_msg, file=sys.stderr)
    raise ValueError(error_msg)

print(f"INFO: Database URL configured: {database_url.split('@')[1] if '@' in database_url else database_url}", file=sys.stderr)

try:
    engine = create_engine(
        database_url,
        pool_pre_ping=False,
        pool_recycle=300,
        echo=False,
        connect_args={"connect_timeout": 10}
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    print("INFO: Database engine created successfully", file=sys.stderr)
except Exception as e:
    error_msg = f"ERROR: Failed to create database engine: {e}"
    print(error_msg, file=sys.stderr)
    print(f"ERROR: Database URL used: {database_url}", file=sys.stderr)
    raise

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

