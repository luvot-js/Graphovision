"""
schemas.py
----------
Pydantic 요청/응답 모델
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    nickname: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── User ──────────────────────────────────────────────────────────────

class UserMe(BaseModel):
    id: int
    email: str
    nickname: str
    credits: int
    created_at: datetime


# ── Analyze ───────────────────────────────────────────────────────────

class AnalyzeResponse(BaseModel):
    result_id: str
    scores: list[float]          # [0.82, 0.64, 0.71, 0.89, 0.55]
    trait_names: list[str]
    report: Optional[str] = None
    credits_remaining: int


# ── Result ────────────────────────────────────────────────────────────

class ResultDetail(BaseModel):
    id: str
    scores: list[float]
    trait_names: list[str]
    report: Optional[str]
    created_at: datetime


class HistoryItem(BaseModel):
    id: str
    scores: list[float]
    created_at: datetime


# ── Compatibility ─────────────────────────────────────────────────────

class CompatibilityRequest(BaseModel):
    result_id_a: str
    result_id_b: str


class CompatibilityResponse(BaseModel):
    harmony_score: float          # 0~100
    synergy_traits: list[str]     # 둘 다 0.7 이상
    caution_traits: list[str]     # 차이 0.4 이상
    scores_a: list[float]
    scores_b: list[float]
    trait_names: list[str]
    report: Optional[str] = None


# ── Billing ───────────────────────────────────────────────────────────

class ChargeRequest(BaseModel):
    amount: int                   # 충전할 크레딧 수


class ChargeResponse(BaseModel):
    credits: int
    delta: int
