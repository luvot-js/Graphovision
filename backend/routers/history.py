"""
routers/history.py
------------------
GET /api/history — 검사 기록 목록
"""

import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db, User, Result
from models.schemas import HistoryItem
from routers.user import get_current_user

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history", response_model=list[HistoryItem])
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = (
        db.query(Result)
        .filter(Result.user_id == current_user.id)
        .order_by(Result.created_at.desc())
        .all()
    )

    return [
        HistoryItem(
            id=r.id,
            scores=json.loads(r.scores),
            created_at=r.created_at,
        )
        for r in results
    ]
