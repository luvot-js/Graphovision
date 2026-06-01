"""
database.py
-----------
SQLite (로컬) / PostgreSQL (배포) 자동 선택
  - 로컬: DATABASE_URL 없음 → SQLite (data/graphovision.db)
  - 배포: DATABASE_URL 환경변수 → PostgreSQL (Railway 제공)
"""

import os
from pathlib import Path
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from datetime import datetime, timezone

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

_db_url = os.environ.get("DATABASE_URL")
if _db_url:
    # Railway는 'postgres://' 형식으로 제공 → SQLAlchemy는 'postgresql://' 필요
    if _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
    DATABASE_URL = _db_url
    engine = create_engine(DATABASE_URL)
else:
    DATABASE_URL = f"sqlite:///{DATA_DIR / 'graphovision.db'}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False, index=True)
    nickname = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    credits = Column(Integer, default=3)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Result(Base):
    __tablename__ = "results"

    id = Column(String, primary_key=True)          # UUID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_path = Column(String)
    scores = Column(Text)                          # JSON: [0.82, 0.64, ...]
    report = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    delta = Column(Integer, nullable=False)        # +5, -1 등
    reason = Column(String)                        # "signup_bonus", "analyze", "purchase"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
