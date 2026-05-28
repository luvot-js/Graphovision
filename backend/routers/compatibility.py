"""
routers/compatibility.py
------------------------
POST /api/compatibility — 두 결과 비교 → 궁합 분석
"""

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, User, Result
from models.schemas import CompatibilityRequest, CompatibilityResponse
from routers.user import get_current_user
from services.inference import TRAIT_NAMES_KR

router = APIRouter(prefix="/api", tags=["compatibility"])


@router.post("/compatibility", response_model=CompatibilityResponse)
def compatibility(
    body: CompatibilityRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result_a = db.query(Result).filter(Result.id == body.result_id_a).first()
    result_b = db.query(Result).filter(Result.id == body.result_id_b).first()

    if not result_a or not result_b:
        raise HTTPException(status_code=404, detail="결과를 찾을 수 없습니다.")

    scores_a = json.loads(result_a.scores)
    scores_b = json.loads(result_b.scores)

    # 조화도 계산
    diffs         = [abs(a - b) for a, b in zip(scores_a, scores_b)]
    harmony_score = round((1 - sum(diffs) / len(diffs)) * 100, 1)

    # 시너지: 둘 다 0.7 이상
    synergy_traits = [
        TRAIT_NAMES_KR[i]
        for i in range(5)
        if scores_a[i] >= 0.7 and scores_b[i] >= 0.7
    ]

    # 주의: 차이 0.4 이상
    caution_traits = [
        TRAIT_NAMES_KR[i]
        for i in range(5)
        if diffs[i] >= 0.4
    ]

    return CompatibilityResponse(
        harmony_score=harmony_score,
        synergy_traits=synergy_traits,
        caution_traits=caution_traits,
        scores_a=scores_a,
        scores_b=scores_b,
        trait_names=TRAIT_NAMES_KR,
    )
