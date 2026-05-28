"""
routers/billing.py
------------------
POST /api/billing/charge — 크레딧 충전 (로컬=즉시 충전)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, User, CreditTransaction
from models.schemas import ChargeRequest, ChargeResponse
from routers.user import get_current_user

router = APIRouter(prefix="/api/billing", tags=["billing"])

MAX_CHARGE = 100


@router.post("/charge", response_model=ChargeResponse)
def charge(
    body: ChargeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.amount <= 0 or body.amount > MAX_CHARGE:
        raise HTTPException(status_code=400, detail=f"충전량은 1~{MAX_CHARGE} 사이여야 합니다.")

    current_user.credits += body.amount
    db.add(CreditTransaction(user_id=current_user.id, delta=body.amount, reason="purchase"))
    db.commit()
    db.refresh(current_user)

    return ChargeResponse(credits=current_user.credits, delta=body.amount)
